const mongoose = require('mongoose');

const { mongooseConnectOptions } = require('../config');

module.exports = {
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
