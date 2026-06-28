import {
	AxisAlignedBoundingBox,
	type BoundingBox,
	type FixedWidthTextAlignment,
	type Size,
	type Vector,
	type VerticalAlignment
} from '$lib/data/common';
import type { TextBoxLayout } from '$lib/data/text-box-layout';
import { MountedObject } from './object';

const horizontalAlignmentCenterOffset: Record<FixedWidthTextAlignment, number> = {
	start: 0.5,
	center: 0,
	end: -0.5,
	justify: 0.5
};
const verticalAlignmentCenterOffset: Record<VerticalAlignment, number> = {
	top: 0.5,
	center: 0,
	bottom: -0.5
};

function getHorizontalCenterOffsetFraction(alignment: FixedWidthTextAlignment) {
	return horizontalAlignmentCenterOffset[alignment];
}
function getVerticalCenterOffsetFraction(alignment: VerticalAlignment) {
	return verticalAlignmentCenterOffset[alignment];
}

interface MountedTextAreaBridge {
	get container(): HTMLElement;
	get layout(): TextBoxLayout;
	get uiScale(): number;
}

export class MountedTextArea extends MountedObject {
	constructor(private readonly bridge: MountedTextAreaBridge) {
		super();
	}

	override computeBoundsInClientSpace(): BoundingBox {
		const clientRect = this.getAxisAlignedBoundingClientRect();

		const clientRectCenter: Vector = {
			x: clientRect.left + clientRect.width / 2,
			y: clientRect.top + clientRect.height / 2
		};

		// If rotation ever gets added to text area objects, this is where
		// it would need to be inverted.
		return AxisAlignedBoundingBox.fromCenter(clientRectCenter, {
			width: clientRect.width,
			height: clientRect.height
		});
	}

	computeHorizontalAlignmentChange(alignment: FixedWidthTextAlignment): TextBoxLayout {
		const { alignH, alignV, anchor, fixedWidth } = this.bridge.layout;

		const currentCenterOffset = getHorizontalCenterOffsetFraction(alignH);
		const newCenterOffset = getHorizontalCenterOffsetFraction(alignment);

		const previousAlignment = alignH;

		if (alignment === 'justify') {
			// Justified text requires a fixed width
			const currentWidth = fixedWidth ?? this.getRenderedSizeInCanvasSpace().width;

			return {
				anchor: {
					x: anchor.x - (newCenterOffset - currentCenterOffset) * currentWidth,
					y: anchor.y
				},
				alignH: alignment,
				alignV: alignV,
				fixedWidth: currentWidth
			};
		} else {
			let newFixedWidth = fixedWidth;

			if (previousAlignment === 'justify') {
				// When flicking through the available alignments, switching to a
				// justified flow and then BACK to non-justified, the editor shouldn't
				// do "invisible" changes.
				//
				// This does bear the potential to remove a user-configured fixed width,
				// but IMO the "flicking through alignments" case is much more likely:
				// The threshold for removing an existing fixed width is 0.01 PIXELS, it
				// seems extremely rare for a user to accidentally resize the text box to be
				// exactly what it would be if free-flowing.
				this.bridge.container.style.width = 'max-content';
				const maxWidth = this.getRenderedSizeInCanvasSpace().width;

				this.bridge.container.style.removeProperty('width');

				const delta = Math.abs(maxWidth - fixedWidth!);
				if (delta < 0.01) {
					// The explicitly set fixed width is SIMILAR to what the text
					// measures at when free-flowing. In this case, prefer resetting
					// to an unconstrained width.
					newFixedWidth = undefined;
				}
			}

			const renderedWidth = fixedWidth ?? this.getRenderedSizeInCanvasSpace().width;

			return {
				anchor: {
					x: anchor.x - (newCenterOffset - currentCenterOffset) * renderedWidth,
					y: anchor.y
				},
				alignH: alignment,
				alignV: alignV,
				fixedWidth: newFixedWidth
			};
		}
	}

	computeVerticalAlignmentChange(alignment: VerticalAlignment): TextBoxLayout {
		const { alignV, anchor, ...layout } = this.bridge.layout;

		const currentCenterOffset = getVerticalCenterOffsetFraction(alignV);
		const newCenterOffset = getVerticalCenterOffsetFraction(alignment);

		const renderedHeight = this.getRenderedSizeInCanvasSpace().height;

		return {
			...layout,
			alignV: alignment,
			anchor: {
				x: anchor.x,
				y: anchor.y - (newCenterOffset - currentCenterOffset) * renderedHeight
			}
		};
	}

	computeWidthResizeChange({
		fixedCenterOffset,
		originalAnchorX,
		originalWidth,
		newWidth
	}: ComputeWidthResizeChangeOptions): TextBoxLayout {
		const { alignH, alignV, anchor } = this.bridge.layout;
		const anchorOffset = getHorizontalCenterOffsetFraction(alignH);

		return {
			alignH,
			alignV,
			anchor: {
				x: originalAnchorX + (fixedCenterOffset - anchorOffset) * (newWidth - originalWidth),
				y: anchor.y
			},
			fixedWidth: newWidth
		};
	}

	getRenderedSizeInCanvasSpace(): Size {
		const renderedScale = this.bridge.uiScale;
		const clientRect = this.getAxisAlignedBoundingClientRect();

		return {
			width: clientRect.width / renderedScale,
			height: clientRect.height / renderedScale
		};
	}

	private getAxisAlignedBoundingClientRect() {
		return this.bridge.container.getBoundingClientRect();
	}
}

interface ComputeWidthResizeChangeOptions {
	/** A value between `-0.5` (right-aligned text box) and `0.5` (left-aligned text box). */
	fixedCenterOffset: number;
	originalAnchorX: number;
	originalWidth: number;
	newWidth: number;
}
