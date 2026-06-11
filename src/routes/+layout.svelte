<script lang="ts">
	import '$lib/ui/style/global.scss';
	import '@fontsource-variable/cascadia-code/wght.css';

	import favicon from '$lib/assets/favicon.svg';
	import { PortalOverlay } from 'svelte-tether';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>notizel</title>
</svelte:head>

<PortalOverlay>
	{@render children()}
</PortalOverlay>
