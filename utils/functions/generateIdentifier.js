import crypto from 'node:crypto';

export default function generateIdentifier(length = 11, chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') {
	const bytes = crypto.randomBytes(length).toString('ascii').split('');
	const hash = [];

	for (let i = 0; i < bytes.length; i++) {
		const byte = bytes[i];
		hash.push(chars[byte.charCodeAt(0) < 62 ? byte.charCodeAt(0) : byte.charCodeAt(0) % 62]);
	}

	return hash.join('');
}
