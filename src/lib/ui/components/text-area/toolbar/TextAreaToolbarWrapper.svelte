<script lang="ts">
	import type { TextBoxAlignment } from '$lib/data/text-box-layout';
	import type { Snippet } from 'svelte';
	import { Tether } from 'svelte-tether';
	import type { TextAreaObjectController } from '../TextAreaObject.svelte';
	import TextAreaToolbar from './TextAreaToolbar.svelte';

	interface Props {
		controller: TextAreaObjectController;
		alignment: TextBoxAlignment;
		visible: boolean;
		children: Snippet;
	}

	let { controller, alignment, visible, children }: Props = $props();
</script>

<Tether {children} origin="top-left" direction="bottom-left">
	{#snippet portal()}
		<TextAreaToolbar {visible} {controller} {alignment} />
	{/snippet}
</Tether>
