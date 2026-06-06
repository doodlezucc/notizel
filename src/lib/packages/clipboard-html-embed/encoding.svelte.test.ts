import { expect, test } from 'vitest';
import { decodeStringFromHtml, encodeStringInHtml } from './encoding';

test.each(['', '"string in quotes"', '<span>', '</span>', '[{"alignV":"start"}]'])(
	'Restore after encoding',
	(testString) => {
		const unparsedHtml = encodeStringInHtml(testString);

		const htmlDocument = Document.parseHTMLUnsafe(unparsedHtml);
		const parsedHtml = htmlDocument.documentElement.outerHTML;

		const restoredString = decodeStringFromHtml(parsedHtml);

		expect(restoredString).toEqual(testString);
	}
);
