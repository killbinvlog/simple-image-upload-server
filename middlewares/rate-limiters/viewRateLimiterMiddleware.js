import expressRateLimit from 'express-rate-limit';
import config from '../../config.js';
import log from '../../utils/functions/log.js';

export default expressRateLimit({
	windowMs: config.server.rateLimiters.view.windowMs,
	max: config.server.rateLimiters.view.max,
	keyGenerator: req => req.ipAddress.toString(),
	handler: (req, res) => {
		log('Server Rate Limiter', `"${req.ipAddress.toString()}" tried to access "${req.protocol}://${req.get('host')}${req.path} [${req.method}]" but get rate limited on view rate limiter (req-id: "${req.id}")`);
		res.status(429).json({ success: false, error: 'Too many requests.' });
	},
});
