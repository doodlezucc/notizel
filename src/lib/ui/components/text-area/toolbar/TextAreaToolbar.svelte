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
	import { IconButton } from '$lib/packages/kit';
	import type { TextAreaObjectController } from '../TextAreaObject.svelte';

	interface Props {
		controller: TextAreaObjectController;
		alignment: TextBoxAlignment;
		visible: boolean;
	}

	let { controller, alignment, visible }: Props = $props();

	const horizontal: FixedWidthTextAlignment[] = ['start', 'center', 'end', 'justify'];
	const vertical: VerticalAlignment[] = ['top', 'center', 'bottom'];
</script>

<div class="toolbar" class:visible>
	<IconButton
		icon={horizontalIcons[alignment.alignH]}
		preventFocusOnClick
		onClick={() =>
			controller.setHorizontalAlignment(
				horizontal[(horizontal.indexOf(alignment.alignH) + 1) % horizontal.length]
			)}
	>
		{alignment.alignH}
	</IconButton>
	<IconButton
		icon={verticalIcons[alignment.alignV]}
		preventFocusOnClick
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
		pointer-events: none;
		display: flex;
		gap: 4px;

		transition: 0.1s cubic-bezier(0.165, 0.84, 0.44, 1);
		margin: 0 0px;
		opacity: 0;

		&.visible {
			pointer-events: all;
			margin: 0 8px;
			opacity: 1;
		}
	}
</style>
