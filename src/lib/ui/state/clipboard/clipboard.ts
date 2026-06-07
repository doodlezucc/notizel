import type { CanvasObject } from '$lib/data/vault';
import * as ClipboardHtmlEmbed from '$lib/packages/clipboard-html-embed';
import {
	freezeCanvasObject,
	unfreezeCanvasObject,
	type LiveCanvasObject,
	type LiveObjectInstantiator
} from '../live-objects';
import type { UIDOMBridge } from '../ui-dom-bridge';

interface ConvertToClipboardOptions {
	objects: LiveCanvasObject[];
	domBridge: UIDOMBridge;
}

export function convertObjectsToClipboard(options: ConvertToClipboardOptions): ClipboardItem {
	const { objects, domBridge } = options;

	const frozenObjects = objects.map(freezeCanvasObject);

	const textObjects = objects
		.filter((object) => object.type === 'text')
		.map((object) => {
			const domHandle = domBridge.getHandle(object.id);

			const centerOfTextArea = domHandle?.computeBoundsInClientSpace().center ?? object.anchor;

			return { object, centerOfTextArea };
		});

	// Sort text objects by their vertical center for a somewhat
	// coherent order in the plain text clipboard.
	textObjects.sort((a, b) => {
		return a.centerOfTextArea.y - b.centerOfTextArea.y;
	});

	const textEntry = textObjects.map(({ object }) => object.editor.getText()).join('\n');
	const htmlEntry = ClipboardHtmlEmbed.encodeStringInHtml(JSON.stringify(frozenObjects));

	return new ClipboardItem({
		'text/plain': textEntry,
		'text/html': htmlEntry
	});
}

interface ConvertFromClipboardOptions {
	clipboardData: DataTransfer;
	liveObjectInstantiator: LiveObjectInstantiator;
}

export async function convertClipboardToObjects(options: ConvertFromClipboardOptions) {
	const frozenObjects = await parseObjectsFromDataTransfer(options.clipboardData);
	if (frozenObjects === null) {
		return null;
	}

	return frozenObjects.map((object) =>
		unfreezeCanvasObject(object, options.liveObjectInstantiator)
	);
}

async function parseObjectsFromDataTransfer(data: DataTransfer) {
	let clipboardItemHtml: DataTransferItem | undefined;

	for (const item of data.items) {
		if (item.kind === 'string' && item.type === 'text/html') {
			clipboardItemHtml = item;
			break;
		}
	}

	if (clipboardItemHtml) {
		const htmlEntry = await new Promise<string>((resolve) => {
			clipboardItemHtml.getAsString(resolve);
		});

		try {
			const clipboardDataJson = ClipboardHtmlEmbed.decodeStringFromHtml(htmlEntry);
			const frozenObjects = JSON.parse(clipboardDataJson) as CanvasObject[];

			return frozenObjects;
		} catch (err) {
			console.error(err);
			return null;
		}
	} else {
		return null;
	}
}
