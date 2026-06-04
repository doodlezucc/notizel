<script lang="ts">
	import { Editor as TiptapEditor } from '@tiptap/core';
	import { onDestroy, onMount, untrack } from 'svelte';

	interface Props {
		editor: TiptapEditor;
		disableInteraction: boolean;
	}

	let { editor, disableInteraction }: Props = $props();

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let renderToken = $state.raw({});
	let element = $state<HTMLElement>();

	$effect(() => {
		if (editor.isEditable !== !disableInteraction) {
			editor.setEditable(!disableInteraction);
		}
	});

	export function focus() {
		editor.commands.focus();
	}

	function onTiptapTransaction() {
		// onTransaction may be triggered via a DOM event (e.g. focus, blur),
		// which itself may have been called by synchronous state changes in a
		// $derived block or similar.
		//
		// Explicitly untracking here fixes a console error after auto-deleting
		// empty text area objects.
		untrack(() => {
			renderToken = {}; // Force a re-render
		});
	}

	onMount(() => {
		editor.mount(element!);
		editor.on('transaction', onTiptapTransaction);
	});

	onDestroy(() => {
		editor.off('transaction', onTiptapTransaction);
		editor.unmount();
	});
</script>

<div bind:this={element} class:unfocused={disableInteraction}></div>

<style lang="scss">
	:global {
		.tiptap {
			outline: none;
			padding: 4px;

			h1,
			h2,
			h3,
			h4,
			h5,
			h6 {
				margin-top: 1rem;
			}

			:first-child {
				margin-top: 0;
			}
		}
	}

	.unfocused :global(.tiptap) {
		user-select: none;
	}
</style>
