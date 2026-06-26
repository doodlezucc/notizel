<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { Snippet } from 'svelte';
	import Tooltip from './Tooltip.svelte';

	interface Props {
		icon: string;
		preventFocusOnClick?: boolean;
		onClick?: () => void;
		children: Snippet;
	}

	let { icon, preventFocusOnClick = false, onClick, children }: Props = $props();

	function handleMouseDown(ev: MouseEvent) {
		if (preventFocusOnClick) {
			ev.preventDefault();
		}
	}
</script>

<Tooltip title={children}>
	<button onmousedown={handleMouseDown} onclick={onClick}>
		<Icon {icon} />
	</button>
</Tooltip>

<style lang="scss">
	@use '$lib/ui/style/scheme.scss';

	$size: 36px;

	button {
		color: inherit;
		font: inherit;
		cursor: pointer;

		display: grid;
		place-content: center;

		border: none;
		border-radius: 8px;
		background-color: scheme.$background-interactable;
		width: $size;
		height: $size;
		box-shadow: 0px 1px 1px #0008;
	}
</style>
