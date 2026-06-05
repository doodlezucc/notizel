import type { PersistenceAPI } from '$lib/data/persistence/api';

export interface DependencyStack {
	persistence: PersistenceAPI;
}
