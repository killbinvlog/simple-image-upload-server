import mongoose from 'mongoose';
import config from '../config.js';

export default {
	init: () => {
		return new Promise((resolve, reject) => {
			mongoose.connect(process.env.MONGODB_URI, config.mongodb_connect_options);

			mongoose.Promise = global.Promise;

			mongoose.connection.on('error', reject);

			mongoose.connection.on('connected', resolve);
		});
	},
};
