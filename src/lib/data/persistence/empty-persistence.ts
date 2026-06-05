import type { ID } from '../common';
import type { CanvasFileData, Vault } from '../vault';
import type { PersistenceAPI } from './api';

export class EmptyPersistence implements PersistenceAPI {
	generateFileId(): ID {
		throw new Error(`EmptyPersistence doesn't provide generateFileId()`);
	}

	async loadVault(): Promise<Vault> {
		return { files: [] };
	}

	async saveFileMeta(): Promise<void> {
		throw new Error(`Files can't be saved in the EmptyPersistence backend`);
	}

	async loadFile(): Promise<CanvasFileData> {
		throw new Error(`Files can't be loaded from the EmptyPersistence backend`);
	}

	async saveFile(): Promise<void> {
		throw new Error(`Files can't be saved in the EmptyPersistence backend`);
	}
}
