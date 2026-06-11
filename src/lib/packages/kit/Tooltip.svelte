<script lang="ts">
	import type { Snippet } from 'svelte';
	import { BaseTetherTooltip, type Alignment } from 'svelte-tether';

	interface Props {
		alignment?: Alignment;
		title: Snippet;
		children: Snippet;
	}

	let { alignment = 'top-center', title, children }: Props = $props();
</script>

<BaseTetherTooltip origin={alignment}>
	{@render children()}

	{#snippet tooltip({ tooltipId, isFocused, isHovered })}
		{@const isVisible = isHovered || isFocused}

		<div id={tooltipId} role="tooltip" class:visible={isVisible} aria-hidden="true">
			{@render title()}
		</div>
	{/snippet}
</BaseTetherTooltip>

<style lang="scss">
	[role='tooltip'] {
		user-select: none;
		pointer-events: none;

		padding: 4px 12px;
		background-color: black;
		color: white;

		transition: 0.1s;
		opacity: 0;
		margin: 0;

		&.visible {
			opacity: 1;
			margin: 4px;
		}
	}
</style>
