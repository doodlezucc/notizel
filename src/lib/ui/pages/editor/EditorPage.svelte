<script lang="ts">
	import type { PersistenceAPI } from '$lib/data/persistence/api';
	import { BrowserStoragePersistence } from '$lib/data/persistence/browser-storage-persistence';
	import { EmptyPersistence } from '$lib/data/persistence/empty-persistence';
	import EditorCanvas from '$lib/ui/components/canvas/EditorCanvas.svelte';
	import UIContextWrapper from '$lib/ui/state/UIContextWrapper.svelte';
	import { onMount } from 'svelte';

	let persistenceApi: PersistenceAPI = $state(new EmptyPersistence());

	onMount(() => {
		persistenceApi = new BrowserStoragePersistence(localStorage);
	});
</script>

<UIContextWrapper {persistenceApi}>
	<EditorCanvas />
</UIContextWrapper>
