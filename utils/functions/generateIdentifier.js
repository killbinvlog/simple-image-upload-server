import crypto from 'node:crypto';

export default function generateIdentifier(length = 11, base62_chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') {
	const bytes = crypto.randomBytes(length).toString('ascii').split('');
	const hash = [];

	for (let i = 0; i < bytes.length; i++) {
		const byte = bytes[i];
		hash.push(base62_chars[byte.charCodeAt(0) < 62 ? byte.charCodeAt(0) : byte.charCodeAt(0) % 62]);
	}

	return hash.join('');
}
