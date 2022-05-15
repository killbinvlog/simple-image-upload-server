import log from '../utils/functions/log.js';

export default function authMiddleware(req, res, next) {
	const basicAuthorizationHeader = req.headers['authorization'];
	if (!basicAuthorizationHeader) {
		log('Server Auth', `"${req.ipAddress.toString()}" tried to access "${req.protocol}://${req.get('host')}${req.path} [${req.method}]" without authorization (req-id: "${req.id}")`);
		return res.status(400).json({ success: false, error: 'Authorization header is missing.' });
	}
	const basicAuthorizationHeaderParts = basicAuthorizationHeader.split(' ');
	const basicToken = basicAuthorizationHeaderParts[1] || null;
	if (basicToken != process.env.API_TOKEN) {
		log('Server Auth', `"${req.ipAddress.toString()}" tried to access "${req.protocol}://${req.get('host')}${req.path} [${req.method}]" with a invalid authorization (req-id: "${req.id}")`);
		return res.status(403).json({ success: false, error: 'Invalid token.' });
	}
	next();
}
