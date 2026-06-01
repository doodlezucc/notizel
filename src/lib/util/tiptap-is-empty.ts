import type { Content } from '@tiptap/core';

export function isTipTapContentEmpty(content: Content) {
	if (content === null) return true;

	if (typeof content === 'string') {
		return content.trim().length === 0;
	}

	if (Array.isArray(content)) {
		if (content.length === 0) {
			return true;
		}

		return content.every(isTipTapContentEmpty);
	}

	if (content.text !== undefined) {
		return content.text.trim().length === 0;
	}

	if (content.content !== undefined) {
		return isTipTapContentEmpty(content.content);
	}

	return true;
}
