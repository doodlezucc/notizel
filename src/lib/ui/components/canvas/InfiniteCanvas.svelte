<script lang="ts">
	import type { CanvasObject } from '$lib/data/vault';
	import TextAreaObject from '../text-area/TextAreaObject.svelte';

	interface Props {
		objects: CanvasObject[];
	}

	let { objects = $bindable() }: Props = $props();
</script>

<div class="canvas">
	{#each objects as object (object)}
		<TextAreaObject
			id={object.id}
			bind:content={object.content}
			bind:anchor={object.anchor}
			bind:alignH={object.alignH}
			bind:alignV={object.alignV}
			bind:fixedWidth={object.fixedWidth}
		/>
	{/each}
</div>

<style lang="scss">
	.canvas {
		position: relative;
		display: grid;
		place-items: center;
		flex: 1;
	}
</style>
