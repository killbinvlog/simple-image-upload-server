import mongoose from 'mongoose';
import config from '../config.js';

export default {
	init: () => {
		return new Promise((resolve, reject) => {
			mongoose.connect(process.env.MONGODB_URI, config.mongodb_connect_options);

			mongoose.Promise = global.Promise;

			mongoose.connection.once('error', reject);

			mongoose.connection.once('connected', resolve);
		});
	},
};
