<script lang="ts">
	import { Editor, type Content } from '@tiptap/core';
	import { StarterKit } from '@tiptap/starter-kit';
	import { onDestroy, onMount, untrack } from 'svelte';

	interface Props {
		content: Content;
		disableInteraction: boolean;
	}

	let { content = $bindable(), disableInteraction }: Props = $props();

	interface EditorState {
		editor: Editor;
	}

	let element = $state<HTMLElement>();

	let editorState = $state.raw<EditorState>();
	let editor = $derived(editorState?.editor);

	$effect(() => {
		if (editor && editor.isEditable !== !disableInteraction) {
			editor.setEditable(!disableInteraction);
		}
	});

	export function focus() {
		editor?.commands.focus();
		editor?.commands.selectAll();
	}

	onMount(() => {
		const editor = new Editor({
			element: element,
			extensions: [StarterKit],
			content,
			onTransaction: ({ editor }) => {
				// onTransaction may be triggered via a DOM event (e.g. focus, blur),
				// which itself may have been called by synchronous state changes in a
				// $derived block or similar.
				//
				// Explicitly untracking here fixes a console error after auto-deleting
				// empty text area objects.
				untrack(() => {
					editorState = { editor }; // Force a re-render
				});
			},
			onUpdate: ({ editor }) => {
				content = editor.getJSON();
			}
		});

		editorState = { editor };
	});

	onDestroy(() => {
		editorState?.editor.destroy();
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
