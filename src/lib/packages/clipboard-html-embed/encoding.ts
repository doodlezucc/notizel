/**
 * Returns a minimal HTML document, which includes `data` inside an element's attribute.
 */
export function encodeStringInHtml(data: string) {
	const encodedData = btoa(data);

	return `
<html>
<head></head>
<body>
<span data-embed="${encodedData}"></span>
</body>
</html>
    `;
}

/**
 * Returns data encoded inside a HTML document, as produced by `encodeStringInHtml`.
 */
export function decodeStringFromHtml(html: string) {
	const validEmbedAttributeStart = html.indexOf('data-embed="');

	if (validEmbedAttributeStart < 0) {
		throw new Error('HTML has no data-embed attribute');
	}

	const start = html.indexOf('"', validEmbedAttributeStart) + 1;
	const end = html.lastIndexOf('"');

	const encodedData = html.substring(start, end);

	return atob(encodedData);
}
