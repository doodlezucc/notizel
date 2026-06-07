<script lang="ts">
	import { useUI } from '$lib/ui/state/UIContextWrapper.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	const ui = useUI();

	function isEventTargetUsingClipboard(target: EventTarget) {
		if (!(target instanceof Node)) return false;

		let node: Node | null = target;

		while (node !== null) {
			if (node instanceof Element) {
				if (
					node instanceof HTMLInputElement ||
					node instanceof HTMLTextAreaElement ||
					node.classList.contains('ProseMirror')
				) {
					return true;
				}
			}

			node = node.parentNode;
		}

		return false;
	}

	function onPaste(ev: ClipboardEvent) {
		const isTargetUsingClipboard = ev.target !== null && isEventTargetUsingClipboard(ev.target);

		if (isTargetUsingClipboard) {
			// Let the paste event be handled natively by the focused element.
			return;
		}

		ev.preventDefault();

		if (ev.clipboardData) {
			ui.commands.gestures.cancelActive();
			ui.commands.clipboard.pasteFromClipboard(ev.clipboardData);
		}
	}
</script>

<svelte:window onpaste={onPaste} />

{@render children()}
