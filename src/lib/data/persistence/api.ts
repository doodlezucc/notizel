import type { ID } from '../common';
import type { CanvasFileData, Vault, VaultFileMeta } from '../vault';

export interface PersistenceAPI {
	loadVault(): Promise<Vault>;
	saveFileMeta(file: VaultFileMeta): Promise<void>;

	generateFileId(): ID;

	loadFile(fileId: ID): Promise<CanvasFileData>;
	saveFile(fileId: ID, data: CanvasFileData): Promise<void>;
}
