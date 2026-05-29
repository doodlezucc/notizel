<script lang="ts">
	import type { CanvasFileData } from '$lib/data/vault';
	import InfiniteCanvas from '$lib/ui/components/canvas/InfiniteCanvas.svelte';

	let canvasFileData = $state<CanvasFileData>({
		objects: [
			{
				type: 'text',
				content: `
					<h1>notizel</h1>
					<p>Note taking and doodling.</p>
				`,
				anchor: { x: 0, y: 0 },
				alignH: 'justify',
				alignV: 'bottom',
				fixedWidth: 400
			}
		]
	});
</script>

<InfiniteCanvas bind:objects={canvasFileData.objects} />
