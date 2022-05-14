import config from '../config.js';
import log from '../utils/functions/log.js';

export default function logRequestMiddleware(req, res, next) {
	if (req.path.startsWith('/check') && config.server.disableLogRequestsOnCheckRoute) return next();
	log('Server', `"${req.ipAddress.toString()}" requested "${req.protocol}://${req.get('host')}${req.path} [${req.method}]" (req-id: "${req.id}")`);
	next();
}
