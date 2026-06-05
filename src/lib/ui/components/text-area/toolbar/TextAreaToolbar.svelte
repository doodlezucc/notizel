<script lang="ts" module>
	import { loadIcons } from '@iconify/svelte';

	const horizontalIcons: Record<FixedWidthTextAlignment, string> = {
		start: 'lucide:text-align-start',
		center: 'lucide:text-align-center',
		end: 'lucide:text-align-end',
		justify: 'lucide:text-align-justify'
	};

	const verticalIcons: Record<VerticalAlignment, string> = {
		top: 'lucide:align-vertical-justify-start',
		center: 'lucide:align-vertical-justify-center',
		bottom: 'lucide:align-vertical-justify-end'
	};

	loadIcons([...Object.values(horizontalIcons), ...Object.values(verticalIcons)]);
</script>

<script lang="ts">
	import type { FixedWidthTextAlignment, VerticalAlignment } from '$lib/data/common';
	import type { TextBoxAlignment } from '$lib/data/vault';
	import IconButton from '$lib/packages/kit/IconButton.svelte';
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
	<IconButton
		icon={horizontalIcons[alignment.alignH]}
		onClick={() =>
			controller.setHorizontalAlignment(
				horizontal[(horizontal.indexOf(alignment.alignH) + 1) % horizontal.length]
			)}
	>
		{alignment.alignH}
	</IconButton>
	<IconButton
		icon={verticalIcons[alignment.alignV]}
		onClick={() =>
			controller.setVerticalAlignment(
				vertical[(vertical.indexOf(alignment.alignV) + 1) % vertical.length]
			)}
	>
		{alignment.alignV}
	</IconButton>
</div>

<style lang="scss">
	.toolbar {
		pointer-events: all;

		display: flex;
		gap: 4px;
		margin: 0 8px;
	}
</style>
