export default {
	mongodb_connect_options: {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	},
	image_uploader: {
		rate_limiter: {
			windowMs: 1 * 60 * 1000,
			max: 10,
		},
		notFoundImage: {
			image_file_path: 'assets/images/not-found.example.jpg',
			'Content-Type': 'image/jpeg',
		},
		expires: '1 year',
		identifiersLength: 11,
		max_file_size_mb: 16 * 1024 * 1024,
		authorized_mime_types: [
			'image/jpeg',
			'image/png',
			'image/gif',
		],
		magics: {
			jpeg: [255, 216, 255],
			png: [137, 80, 78],
			gif: [71, 73, 70],
		},
	},
};