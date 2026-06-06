import type { Vector } from '$lib/data/common';
import type { AreaSelectGesture } from '$lib/ui/state/ui-commands';
import { UIGeneralEditingScope } from '$lib/ui/state/ui-editing-scope.svelte';
import type { UIContext } from '$lib/ui/state/ui-state.svelte';

export class AreaSelectionManager {
	constructor(private readonly ui: UIContext) {}

	private activeGesture: AreaSelectGesture | null = null;
	private scheduledUpdate: number | null = null;
	private currentPointerPosition!: Vector;

	onPrimaryPointerDown(ev: PointerEvent) {
		if (this.ui.editingScope instanceof UIGeneralEditingScope && this.ui.activeGesture === null) {
			this.activeGesture = this.ui.commands.startAreaSelecting({ x: ev.clientX, y: ev.clientY });
		}
	}

	onPointerMove(ev: PointerEvent) {
		if (!this.activeGesture) return;

		this.currentPointerPosition = { x: ev.clientX, y: ev.clientY };

		if (this.scheduledUpdate === null) {
			this.scheduledUpdate = requestAnimationFrame(() => {
				this.activeGesture?.updatePointerPosition(this.currentPointerPosition);
				this.scheduledUpdate = null;
			});
		}
	}

	onPointerUp() {
		if (!this.activeGesture) return;

		this.activeGesture.submit();
		this.activeGesture = null;
	}
}
