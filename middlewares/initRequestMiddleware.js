import ipaddr from 'ipaddr.js';
import config from '../config.js';

let reqId = 0;

export default function initRequestMiddleware(req, res, next) {
	req.id = reqId;
	reqId++;
	req.ipAddress = ipaddr.process((config.server.usingCloudflare ? req.headers['cf-connecting-ip'] : null) ?? req.socket.remoteAddress);
	next();
}
