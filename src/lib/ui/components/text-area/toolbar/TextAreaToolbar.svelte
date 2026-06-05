<script lang="ts">
	import type { FixedWidthTextAlignment, VerticalAlignment } from '$lib/data/common';
	import type { TextBoxAlignment } from '$lib/data/vault';
	import type { TextAreaObjectController } from '../TextAreaObject.svelte';

	interface Props {
		controller: TextAreaObjectController;
		alignment: TextBoxAlignment;
	}

	let { controller, alignment }: Props = $props();

	const horizontal: FixedWidthTextAlignment[] = ['start', 'center', 'end', 'justify'];
	const vertical: VerticalAlignment[] = ['top', 'center', 'bottom'];
</script>

<div class="toolbar">
	<button
		onclick={() =>
			controller.setHorizontalAlignment(
				horizontal[(horizontal.indexOf(alignment.alignH) + 1) % horizontal.length]
			)}
	>
		{alignment.alignH}
	</button>
	<button
		onclick={() =>
			controller.setVerticalAlignment(
				vertical[(vertical.indexOf(alignment.alignV) + 1) % vertical.length]
			)}
	>
		{alignment.alignV}
	</button>
</div>

<style lang="scss">
	.toolbar {
		pointer-events: all;
	}
</style>
