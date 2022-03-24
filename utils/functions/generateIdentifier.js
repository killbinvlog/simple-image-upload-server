import crypto from 'node:crypto';

export default function generate_identifier(length = 11) {
	let base62_chars = '0123456789';
	base62_chars += 'abcdefghijklmnopqrstuvwxyz';
	base62_chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

	const bytes = crypto.randomBytes(length).toString('ascii').split('');
	const hash = [];

	for (let i = 0; i < bytes.length; i++) {
		const byte = bytes[i];

		if (byte.charCodeAt(0) < 62) {
			hash.push(base62_chars[byte.charCodeAt(0)]);
		}
		else {
			hash.push(base62_chars[byte.charCodeAt(0) % 62]);
		}
	}

	return hash.join('');
}