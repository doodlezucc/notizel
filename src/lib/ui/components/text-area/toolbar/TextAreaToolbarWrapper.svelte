<script lang="ts">
	import type { TextBoxAlignment } from '$lib/data/vault';
	import type { Snippet } from 'svelte';
	import { Tether } from 'svelte-tether';
	import type { TextAreaObjectController } from '../TextAreaObject.svelte';
	import TextAreaToolbar from './TextAreaToolbar.svelte';

	interface Props {
		controller: TextAreaObjectController;
		alignment: TextBoxAlignment;
		children: Snippet;
	}

	let { controller, alignment, children }: Props = $props();
</script>

<Tether {children} origin="top-left" direction="bottom-left">
	{#snippet portal()}
		<TextAreaToolbar {controller} {alignment} />
	{/snippet}
</Tether>
