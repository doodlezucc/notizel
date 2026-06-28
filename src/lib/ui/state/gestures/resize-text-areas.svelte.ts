import type { HorizontalDirection, ID } from '$lib/data/common';
import { extractLayout, type TextBoxLayout } from '$lib/data/text-box-layout';
import { MountedTextArea } from '../dom-bridge/text-area';
import type { LiveTextCanvasObject } from '../live-objects';
import type { DependencyStack } from '../stack/dependency-stack';
import { Gesture } from './gestures';

interface ResizeTextAreasGestureContext {
	side: HorizontalDirection;
}

interface TextAreaInfo {
	originalAnchorX: number;
	originalWidth: number;
	live: LiveTextCanvasObject;
	mounted: MountedTextArea;
}

export class ResizeTextAreasGesture extends Gesture {
	private readonly originalLayouts = new Map<ID, TextBoxLayout>();
	private readonly newLayouts = new Map<ID, TextBoxLayout>();
	private readonly smallestOriginalWidth: number;

	private readonly affectedTextAreas: TextAreaInfo[] = [];
	private hasMovedAtAll = false;
	private totalMovement = 0;

	constructor(
		stack: DependencyStack,
		private readonly context: ResizeTextAreasGestureContext
	) {
		super(stack);

		const scope = this.requireGeneralEditingScope();
		const textAreaObjects = this.ui.objects.filter(
			(object) => object.type === 'text' && scope.selectedIds.has(object.id)
		);

		if (textAreaObjects.length === 0) {
			throw new Error('No text areas are currently selected');
		}

		let smallestOriginalWidth = Number.POSITIVE_INFINITY;

		for (const object of textAreaObjects) {
			const mountedTextArea = this.stack.domBridge.getHandle(object.id);

			if (!mountedTextArea || !(mountedTextArea instanceof MountedTextArea)) {
				throw new Error('Text area to measure is not mounted');
			}

			const textAreaWidth =
				object.fixedWidth ?? mountedTextArea.getRenderedSizeInCanvasSpace().width;

			smallestOriginalWidth = Math.min(smallestOriginalWidth, textAreaWidth);

			this.originalLayouts.set(object.id, extractLayout(object));
			this.affectedTextAreas.push({
				originalAnchorX: object.anchor.x,
				originalWidth: textAreaWidth,
				live: object,
				mounted: mountedTextArea
			});
		}

		this.smallestOriginalWidth = smallestOriginalWidth;
	}

	resizeBy(delta: number, symmetric: boolean) {
		if (this.isOver) return;

		this.hasMovedAtAll = true;
		this.totalMovement += delta;

		const totalDelta = symmetric ? this.totalMovement * 2 : this.totalMovement;
		let widthDelta: number;

		if (this.context.side === 'right') {
			widthDelta = Math.max(totalDelta, -this.smallestOriginalWidth);
		} else {
			widthDelta = Math.max(-totalDelta, -this.smallestOriginalWidth);
		}

		const fixedCenterOffset = symmetric ? 0 : this.context.side === 'right' ? 0.5 : -0.5;

		for (const textArea of this.affectedTextAreas) {
			const newLayout = textArea.mounted.computeWidthResizeChange({
				fixedCenterOffset,
				originalAnchorX: textArea.originalAnchorX,
				originalWidth: textArea.originalWidth,
				newWidth: textArea.originalWidth + widthDelta
			});
			Object.assign(textArea.live, newLayout);
		}
	}

	protected onComplete() {
		if (!this.hasMovedAtAll) {
			// No resizing happened, therefore no history entry is needed.
			return;
		}

		for (const affectedTextArea of this.affectedTextAreas) {
			const textArea = affectedTextArea.live;
			this.newLayouts.set(textArea.id, extractLayout(textArea));
		}

		this.history.execute('Resize text area', ({ isRedo }) => {
			if (isRedo) {
				this.applyNewLayouts();
			}

			return () => {
				this.applyOriginalLayouts();
			};
		});
	}

	protected onCancel() {
		this.applyOriginalLayouts();
	}

	private applyOriginalLayouts() {
		this.applyLayouts(this.originalLayouts);
	}

	private applyNewLayouts() {
		this.applyLayouts(this.newLayouts);
	}

	private applyLayouts(layouts: Map<ID, TextBoxLayout>) {
		for (const object of this.ui.objects) {
			const newLayout = layouts.get(object.id);

			if (newLayout) {
				Object.assign(object, newLayout);
			}
		}
	}
}
