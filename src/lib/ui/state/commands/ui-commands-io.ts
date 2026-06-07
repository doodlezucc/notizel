import type { ID } from '$lib/data/common';
import type { CanvasFileData, VaultFileMeta } from '$lib/data/vault';
import { Temporal } from 'temporal-polyfill';
import { StackUser } from '../stack/stack-user';
import { UIGeneralEditingScope } from '../ui-editing-scope.svelte';

export class UICommandsIO extends StackUser {
	private get persistence() {
		return this.stack.persistence;
	}

	async saveFile() {
		const now = Temporal.Now.instant();

		if (!this.ui.fileMeta) {
			const newFileId = this.generateFreeFileId();

			const meta: VaultFileMeta = {
				id: newFileId,
				createdAt: now,
				modifiedAt: now,
				name: 'Untitled'
			};

			await this.persistence.saveFileMeta(meta);
			await this.persistence.saveFile(meta.id, this.ui.toFileData());
			this.ui.vault.files.push(meta);
			this.ui.fileMeta = meta;
		} else {
			const meta = this.ui.fileMeta;
			meta.modifiedAt = now;
			await this.persistence.saveFileMeta(meta);
			await this.persistence.saveFile(meta.id, this.ui.toFileData());
		}
	}

	private generateFreeFileId() {
		let id = this.persistence.generateFileId();

		const existingIds = new Set(this.ui.vault.files.map((file) => file.id));
		while (existingIds.has(id)) {
			id = this.persistence.generateFileId();
		}

		return id;
	}

	async loadFile(fileId: ID) {
		const fileMeta = this.ui.vault.files.find((file) => file.id === fileId);

		if (!fileMeta) {
			throw new Error('File meta to load by ID not available in vault');
		}

		const fileData = await this.persistence.loadFile(fileId);

		this.applyFromFile(fileMeta, fileData);
	}

	private applyFromFile(meta: VaultFileMeta, data: CanvasFileData) {
		this.ui.fileMeta = meta;
		this.ui.camera = data.camera;
		this.ui.objects = data.objects.map((object) =>
			this.stack.liveObjectInstantiator.unfreezeCanvasObject(object)
		);
		this.ui.editingScope = new UIGeneralEditingScope([]);
	}
}
