export default {
	server: {
		enableCheckRoute: false,
		disableLogRequestsOnCheckRoute: false,
		usingCloudflare: false,
		startupMessage: false,
	},
	mongodbConnectOptions: {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	},
	imageUploader: {
		cacheTimeMs: 15 * 60 * 1000,
		rateLimiter: {
			windowMs: 1 * 60 * 1000,
			max: 10,
		},
		notFoundImage: {
			imageFilePath: 'assets/images/not-found.example.jpg',
			'Content-Type': 'image/jpeg',
		},
		expires: '1 year',
		identifiersLength: 11,
		maxFileSizeMb: 16 * 1024 * 1024,
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
