import mongoose from 'mongoose';
import config from '../config.js';
const { mongooseConnectOptions } = config;

export default {
	init: (options = mongooseConnectOptions) => {
		return new Promise(resolve => {
			mongoose.connect(process.env.MONGODB_URI, options);
			mongoose.Promise = global.Promise;

			mongoose.connection.on('connected', () => {
				console.log('[MongoDB] => Database connected!');
				resolve(true);
			});
		});
	},
};
