import { expect, test } from 'vitest';
import { decodeStringFromHtml, encodeStringInHtml } from './encoding';

test.each(['', '"string in quotes"', '<span>', '</span>'])(
	'Restore  after encoding',
	(testString) => {
		const html = encodeStringInHtml(testString);
		const restoredString = decodeStringFromHtml(html);

		expect(restoredString).toEqual(testString);
	}
);
