import mongoose from 'mongoose';

export default function connectDb(options) {
	return new Promise((resolve, reject) => {
		mongoose.connect(process.env.MONGODB_URI, options);
		mongoose.Promise = global.Promise;
		mongoose.connection.once('error', reject);
		mongoose.connection.once('connected', resolve);
	});
}
