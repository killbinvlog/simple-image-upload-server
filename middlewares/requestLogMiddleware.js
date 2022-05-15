import config from '../config.js';
import log from '../utils/functions/log.js';

export default function requestLogMiddleware(req, res, next) {
	if (req.path.startsWith('/check') && config.server.disableLogsOnCheckRoute) return next();
	log('Server', `${req.ipAddress} requested ${req.protocol}://${req.get('host')}${req.path} (method: ${req.method}, http: ${req.httpVersion}, user-agent: ${req.get('User-Agent')}, req-id: ${req.id})`);
	next();
}
