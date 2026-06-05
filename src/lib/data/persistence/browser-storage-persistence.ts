import type { ID } from '../common';
import type { CanvasFileData, Vault, VaultFileMeta } from '../vault';
import type { PersistenceAPI } from './api';
import { convertVaultFromJson, convertVaultToJson } from './vault-json';

const KEY_VAULT = 'notizel-vault';

function getFileKey(fileId: ID) {
	return `notizel-file-${fileId}`;
}

export class BrowserStoragePersistence implements PersistenceAPI {
	private readonly storage: Storage;

	constructor(storage: Storage) {
		this.storage = storage;
	}

	generateFileId(): ID {
		return crypto.randomUUID();
	}

	async loadVault(): Promise<Vault> {
		const vaultJson = this.storage.getItem(KEY_VAULT);

		if (!vaultJson) {
			return { files: [] };
		}

		return convertVaultFromJson(JSON.parse(vaultJson));
	}

	private saveVault(vault: Vault) {
		this.storage.setItem(KEY_VAULT, JSON.stringify(convertVaultToJson(vault)));
	}

	async saveFileMeta(file: VaultFileMeta): Promise<void> {
		const vault = await this.loadVault();

		for (let i = 0; i < vault.files.length; i++) {
			if (vault.files[i].id === file.id) {
				// Overwrite existing file meta
				vault.files[i] = file;
				this.saveVault(vault);
				return;
			}
		}

		vault.files.push(file);
		this.saveVault(vault);
	}

	async loadFile(fileId: ID): Promise<CanvasFileData> {
		const key = getFileKey(fileId);
		const fileJson = this.storage.getItem(key);

		if (!fileJson) {
			throw new Error(`File by ID ${fileId} doesn't exist in this storage`);
		}

		return JSON.parse(fileJson);
	}

	async saveFile(fileId: ID, data: CanvasFileData): Promise<void> {
		const key = getFileKey(fileId);
		console.log(data);
		this.storage.setItem(key, JSON.stringify(data));
	}
}
