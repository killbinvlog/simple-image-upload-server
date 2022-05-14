export default {
	server: {
		enableCheckRoute: false,
		disableLogRequestsOnCheckRoute: false,
		usingCloudflare: false,
		startupMessage: false,
		rateLimiters: {
			upload: {
				windowMs: 5 * 60 * 1000,
				max: 20,
			},
			view: {
				windowMs: 10 * 60 * 1000,
				max: 100,
			},
		},
	},
	mongodbConnectOptions: {
		autoIndex: false,
		maxPoolSize: 10,
		serverSelectionTimeoutMS: 5000,
		socketTimeoutMS: 45000,
		family: 4,
	},
	imageUploader: {
		cacheTimeMs: 15 * 60 * 1000,
		notFoundImage: {
			imageFilePath: 'assets/images/not-found.example.jpg',
			'Content-Type': 'image/jpeg',
		},
		expires: '1 year',
		identifiers: {
			length: 11,
			chars: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
		},
		// You cannot create images larger than 16mb, please refer to https://www.mongodb.com/docs/manual/reference/limits/#mongodb-limit-BSON-Document-Size
		maxFileSizeMb: 12 * 1024 * 1024,
		authorizedMimeTypes: [
			'image/jpeg',
			'image/png',
			'image/gif',
		],
		mimeTypesExtensions: {
			'image/jpeg': 'jpg',
			'image/png': 'png',
			'image/gif': 'gif',
		},
		magics: {
			jpeg: [255, 216, 255],
			png: [137, 80, 78],
			gif: [71, 73, 70],
		},
	},
};
