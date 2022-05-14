import mongoose from 'mongoose';
import config from '../config.js';

export default function connectDb() {
	return new Promise((resolve, reject) => {
		mongoose.connect(process.env.MONGODB_URI, config.mongodbConnectOptions);
		mongoose.Promise = global.Promise;
		mongoose.connection.once('error', reject);
		mongoose.connection.once('connected', resolve);
	});
}
