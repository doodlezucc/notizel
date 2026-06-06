import type { PersistenceAPI } from '$lib/data/persistence/api';
import type { ChangeHistory } from '$lib/packages/history';
import type { UIDOMBridge } from '../ui-dom-bridge';
import type { UIState } from '../ui-state.svelte';

export interface DependencyStack {
	domBridge: UIDOMBridge;
	ui: UIState;
	history: ChangeHistory;
	persistence: PersistenceAPI;
}
