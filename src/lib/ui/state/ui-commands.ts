import { Vectors, type ID, type Vector } from '$lib/data/common';
import type { CanvasFileData, TextBoxLayout, VaultFileMeta } from '$lib/data/vault';
import { ChangeHistory, type Change } from '$lib/packages/history';
import type { OmitFromUnion } from '$lib/util/types';
import { Temporal } from 'temporal-polyfill';
import type { DependencyStack } from './dependency-stack';
import {
	unfreezeCanvasObject,
	type LiveObjectInstantiator,
	type LiveTextCanvasObject
} from './live-objects';
import { createTiptapEditor } from './tiptap/editor';
import { UIGeneralEditingScope, UITextAreaEditingScope } from './ui-editing-scope.svelte';
import type { UIState } from './ui-state.svelte';

export class UICommands {
	private readonly ui: UIState;
	private readonly dependencyStack: DependencyStack;

	private history = new ChangeHistory();

	constructor(ui: UIState, dependencyStack: DependencyStack) {
		this.ui = ui;
		this.dependencyStack = dependencyStack;
	}

	private get persistence() {
		return this.dependencyStack.persistence;
	}

	private readonly liveObjectInstantiator: LiveObjectInstantiator = {
		createTiptapEditor: (initialContent) => {
			return createTiptapEditor({
				initialContent,
				registerHistoryChange: (change) => this.history.execute('Edit text', change)
			});
		}
	};

	async saveFile() {
		const now = Temporal.Now.instant();

		if (!this.ui.fileMeta) {
			const newFileId = this.persistence.generateFileId();

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
			unfreezeCanvasObject(object, this.liveObjectInstantiator)
		);
		this.ui.editingScope = new UIGeneralEditingScope([]);
	}

	undo() {
		return this.history.undo();
	}

	redo() {
		return this.history.redo();
	}

	createTextArea(props: OmitFromUnion<LiveTextCanvasObject, 'id' | 'type' | 'editor'>) {
		const objectId = crypto.randomUUID(); // Maybe swap this out with a simple incremental ID

		const newObject: LiveTextCanvasObject = {
			...props,
			id: objectId,
			type: 'text',
			editor: this.liveObjectInstantiator.createTiptapEditor('')
		};

		const previousScope = this.ui.editingScope;

		this.history.execute('Add text area', () => {
			this.ui.objects.push(newObject);
			this.ui.editingScope = new UITextAreaEditingScope(objectId);

			return () => {
				this.ui.editingScope = previousScope;
				this.ui.objects = this.ui.objects.filter((object) => object.id !== objectId);
			};
		});
	}

	exitEditingScope() {
		const scope = this.ui.editingScope;
		if (scope instanceof UITextAreaEditingScope) {
			this.exitTextAreaScope(scope);
		} else if (scope instanceof UIGeneralEditingScope) {
			this.clearSelection();
		}
	}

	private exitTextAreaScope(scope: UITextAreaEditingScope) {
		const { objectId } = scope;
		const textObject = this.ui.objects.find((object) => object.id === objectId);

		if (!textObject) return;

		if (textObject.editor.isEmpty) {
			// Auto-delete empty text area

			// Set last editor content to what it was just before clearing
			textObject.editor.commands.undo();

			this.history.execute('Remove empty text area', () => {
				this.ui.editingScope = new UIGeneralEditingScope([]);
				this.ui.objects = this.ui.objects.filter((object) => object.id !== objectId);

				return () => {
					this.ui.objects.push(textObject);
					this.ui.editingScope = scope;
				};
			});
		} else {
			this.history.execute('Exit text editing', () => {
				this.ui.editingScope = new UIGeneralEditingScope([objectId]);

				return () => {
					this.ui.editingScope = scope;
				};
			});
		}
	}

	enterTextAreaEditingScope(textObjectId: ID) {
		const previousScope = this.ui.editingScope;

		this.history.execute('Enter text editing', () => {
			this.ui.editingScope = new UITextAreaEditingScope(textObjectId);

			return () => {
				this.ui.editingScope = previousScope;
			};
		});
	}

	// TODO: Refactor into borrowed gesture handle
	moveSelectionByOffset(offset: Vector) {
		const scope = this.requireGeneralEditingScope();
		this.ui.moveObjectsByOffset(scope.selectedIds, offset);
	}

	submitMoveSelectionByOffset(totalOffset: Vector) {
		const scope = this.requireGeneralEditingScope();
		const affectedIds = new Set(scope.selectedIds);

		const message = affectedIds.size === 1 ? 'Move object' : `Move ${affectedIds.size} objects`;

		this.history.execute(message, ({ isRedo }) => {
			if (isRedo) {
				this.ui.moveObjectsByOffset(affectedIds, totalOffset);
			}

			return () => {
				this.ui.moveObjectsByOffset(affectedIds, Vectors.negate(totalOffset));
			};
		});
	}

	submitTextAreaLayout(objectId: ID, layout: TextBoxLayout) {
		const textObject = this.ui.objects.find((object) => object.id === objectId);

		if (!textObject || textObject.type !== 'text') {
			throw new Error('Object is not a text area');
		}

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { id, type, editor, ...previousLayout } = textObject;

		this.history.execute('Change textbox layout', () => {
			Object.assign(textObject, layout);

			return () => {
				Object.assign(textObject, previousLayout);
			};
		});
	}

	select(ids: Iterable<ID>, { deselectOthers }: { deselectOthers: boolean }) {
		const idsToSelect = new Set(ids);

		this.history.execute(
			'Select',
			this.createSelectionChange((currentSelection) => {
				if (deselectOthers) {
					return idsToSelect;
				} else {
					return currentSelection.union(idsToSelect);
				}
			})
		);
	}

	toggleSelected(id: ID) {
		this.history.execute(
			'Toggle select',
			this.createSelectionChange((currentSelection) => {
				const newSelection = new Set(currentSelection);

				if (!newSelection.delete(id)) {
					// ID was not previously present in the set.
					newSelection.add(id);
				}

				return newSelection;
			})
		);
	}

	private createSelectionChange(modifySelection: (set: ReadonlySet<ID>) => Set<ID>): Change {
		const scope = this.requireGeneralEditingScope();
		const previousSelection = new Set(scope.selectedIds);
		const newSelection = modifySelection(scope.selectedIds);

		return () => {
			this.applySelection(newSelection);

			return () => {
				this.applySelection(previousSelection);
			};
		};
	}

	private applySelection(idSet: ReadonlySet<ID>) {
		const scope = this.requireGeneralEditingScope();

		const idsToRemove = scope.selectedIds.difference(idSet);

		if (idsToRemove.size === scope.selectedIds.size) {
			scope.selectedIds.clear();
		} else {
			for (const idToRemove of idsToRemove) {
				scope.selectedIds.delete(idToRemove);
			}
		}

		const idsToAdd = idSet.difference(scope.selectedIds);
		for (const idToAdd of idsToAdd) {
			scope.selectedIds.add(idToAdd);
		}
	}

	private requireGeneralEditingScope(): UIGeneralEditingScope {
		if (!(this.ui.editingScope instanceof UIGeneralEditingScope)) {
			throw new Error('Selection is only possible in a general editing scope');
		}
		return this.ui.editingScope;
	}

	clearSelection() {
		if (this.requireGeneralEditingScope().selectedIds.size === 0) {
			// Nothing is selected
			return;
		}

		this.history.execute(
			'Deselect all',
			this.createSelectionChange(() => new Set())
		);
	}

	deleteSelection() {
		const scope = this.requireGeneralEditingScope();

		const affectedIds = new Set(scope.selectedIds);
		if (affectedIds.size === 0) {
			return;
		}

		const message = affectedIds.size === 1 ? 'Remove object' : `Remove ${affectedIds.size} objects`;
		const affectedObjects = this.ui.objects.filter((object) => affectedIds.has(object.id));

		this.history.execute(message, () => {
			const scope = this.requireGeneralEditingScope();
			scope.selectedIds.clear();
			this.ui.objects = this.ui.objects.filter((object) => !affectedIds.has(object.id));

			return () => {
				const scope = this.requireGeneralEditingScope();
				this.ui.objects.push(...affectedObjects);

				for (const id of affectedIds) {
					scope.selectedIds.add(id);
				}
			};
		});
	}
}
