<script lang="ts">
	interface Props {
		onPointerDown: (ev: PointerEvent) => void;
	}

	let { onPointerDown }: Props = $props();
</script>

<div class="hitbox" role="separator" aria-orientation="horizontal" onpointerdown={onPointerDown}>
	<div class="highlight"></div>
</div>

<style lang="scss">
	@use '$lib/ui/style/scheme.scss';

	.hitbox {
		cursor: ew-resize;

		position: absolute;
		width: 16px;
		transform: translateX(-50%);
		display: grid;
		place-items: center;

		&:hover {
			.highlight {
				background-color: scheme.$primary;
			}
		}
	}

	.highlight {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 2px;
		border-radius: 4px;
	}
</style>
