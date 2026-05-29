<script lang="ts">
	import { Editor, type Content } from '@tiptap/core';
	import { StarterKit } from '@tiptap/starter-kit';
	import { onDestroy, onMount } from 'svelte';

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
	let isEditorFocused = $derived(editor?.isFocused ?? false);

	$effect(() => {
		if (editor && editor.isEditable !== !disableInteraction) {
			editor.setEditable(!disableInteraction);
		}
	});

	export function isFocused() {
		return isEditorFocused;
	}

	onMount(() => {
		const editor = new Editor({
			element: element,
			extensions: [StarterKit],
			content,
			onTransaction: ({ editor }) => {
				// Increment the state signal to force a re-render
				editorState = { editor };
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
