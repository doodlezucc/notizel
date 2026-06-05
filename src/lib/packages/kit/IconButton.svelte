<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { Snippet } from 'svelte';
	import Tooltip from './Tooltip.svelte';

	interface Props {
		icon: string;
		onClick?: () => void;
		children: Snippet;
	}

	let { icon, onClick, children }: Props = $props();
</script>

<Tooltip title={children}>
	<button onclick={onClick}>
		<Icon {icon} />
	</button>
</Tooltip>

<style lang="scss">
	$size: 36px;

	button {
		color: inherit;
		font: inherit;
		cursor: pointer;

		display: grid;
		place-content: center;

		border: none;
		border-radius: 8px;
		background-color: #f2f2f2;
		width: $size;
		height: $size;
		box-shadow: 0px 1px 1px #0008;
	}
</style>
