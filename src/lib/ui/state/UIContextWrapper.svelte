<script lang="ts" module>
	import type { CameraTransform, ID } from '$lib/data/common';
	import type { PersistenceAPI } from '$lib/data/persistence/api';
	import { EmptyPersistence } from '$lib/data/persistence/empty-persistence';
	import type { VaultFileMeta } from '$lib/data/vault';
	import { ChangeHistory } from '$lib/packages/history';
	import type { DependencyStack } from './stack/dependency-stack';
	import { StackUser } from './stack/stack-user';
	import { UICommands } from './ui-commands';
	import { UIDOMBridge } from './ui-dom-bridge';
	import { UIGeneralEditingScope } from './ui-editing-scope.svelte';
	import { UIState, type UIContext } from './ui-state.svelte';

	const CONTEXT_KEY = Symbol();

	export function useUI() {
		return getContext<UIContext>(CONTEXT_KEY);
	}

	class UIContextImpl extends StackUser implements UIContext {
		readonly commands: UICommands;

		constructor(dependencyStack: DependencyStack) {
			super(dependencyStack);
			this.commands = new UICommands(dependencyStack);
		}

		get bridge() {
			return this.domBridge;
		}

		async initialize() {
			this.ui.vault = await this.persistence.loadVault();

			let mostRecentFile: VaultFileMeta | undefined;
			for (const file of this.ui.vault.files) {
				if (mostRecentFile === undefined) {
					mostRecentFile = file;
				} else if (
					file.modifiedAt.epochMilliseconds > mostRecentFile.modifiedAt.epochMilliseconds
				) {
					mostRecentFile = file;
				}
			}

			if (mostRecentFile) {
				this.commands.loadFile(mostRecentFile.id);
			}
		}

		get camera() {
			return this.ui.camera;
		}
		set camera(camera: CameraTransform) {
			this.ui.camera = camera;
		}

		readonly activeGesture = $derived.by(() => this.ui.activeGesture);

		readonly vault = $derived.by(() => this.ui.vault);
		readonly fileMeta = $derived.by(() => this.ui.fileMeta);

		readonly objects = $derived.by(() => this.ui.objects);
		readonly editingScope = $derived.by(() => this.ui.editingScope);
		readonly selectedIds = $derived.by<ReadonlySet<ID>>(() => {
			const scope = this.editingScope;
			if (scope instanceof UIGeneralEditingScope) {
				return scope.selectedIds;
			} else {
				return new Set();
			}
		});
	}
</script>

<script lang="ts">
	import { getContext, setContext, untrack, type Snippet } from 'svelte';

	interface Props {
		persistenceApi: PersistenceAPI;
		children: Snippet;
	}

	let { persistenceApi, children }: Props = $props();

	const dependencyStack: DependencyStack = {
		domBridge: new UIDOMBridge(),
		history: new ChangeHistory(),
		ui: new UIState(),
		persistence: new EmptyPersistence()
	};

	$effect(() => {
		dependencyStack.persistence = persistenceApi;

		untrack(() => {
			if (!(persistenceApi instanceof EmptyPersistence)) {
				uiContext.initialize();
			}
		});
	});

	const uiContext = new UIContextImpl(dependencyStack);

	setContext<UIContext>(CONTEXT_KEY, uiContext);
</script>

{@render children()}
