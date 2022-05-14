export default {
	// Server configuration
	server: {
		// Enable the /check route on the server (used to check if the server is running)
		enableCheckRoute: false,
		// Disable logs on the route /check
		disableLogsOnCheckRoute: false,
		// Set it to true if you are using Cloudflare (if true the ip will be determined by the CF-Connecting-IP header)
		usingCloudflare: false,
		// If this parameter is not set to false, the value will be logged when the server starts
		startupMessage: false,
		// Rate limiters configuration (please refer to https://github.com/nfriedly/express-rate-limit for more information)
		rateLimiters: {
			// Rate limiter configuration for /upload route
			upload: {
				// The time in milliseconds before resetting the counter
				windowMs: 5 * 60 * 1000,
				// The maximum number of requests allowed in the windowMs
				max: 20,
				// In this example, the rate limiter will limit each IP address to 20 requests in 5 minutes
			},
			// Rate limiter configuration for /:id route
			view: {
				// The time in milliseconds before resetting the counter
				windowMs: 10 * 60 * 1000,
				// The maximum number of requests allowed in the windowMs
				max: 100,
				// In this example, the rate limiter will limit each IP address to 100 requests in 10 minutes
			},
		},
	},
	// Database configuration
	mongodb: {
		// The name of the collection to use
		collectionName: 'images',
		// MongoDB connection options (please refer to https://mongoosejs.com/docs/connections.html#options for more information)
		connectionOptions: {
			autoIndex: false,
			maxPoolSize: 10,
			serverSelectionTimeoutMS: 5000,
			socketTimeoutMS: 45000,
			family: 4,
		},
	},
	// Image uploader configuration
	imageUploader: {
		// The form data field name used to upload the image
		formDataFieldName: 'image',
		// The time in milliseconds before images are deleted from the cache
		cacheTimeMs: 15 * 60 * 1000,
		// Not found image configuration
		notFoundImage: {
			// The path to the not found image
			imageFilePath: 'assets/images/not-found.example.jpg',
			// The mime type of the not found image (will be used to set the Content-Type header)
			'Content-Type': 'image/jpeg',
		},
		// The lifetime of the images in the database (please refer to https://mongoosejs.com/docs/api/schema.html#schema_Schema-index [third point] for more information)
		expires: '1 year',
		// Identifiers configuration (the identifiers are used to generate the public_id property of the images in the database, the public_id is also used in the image url)
		identifiers: {
			// The length of identifiers
			length: 11,
			// The characters that are allowed in the identifiers (please avoid special characters)
			chars: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
		},
		// The maximum size of images that can be uploaded to the server (you cannot create images larger than 16mb, please refer to https://www.mongodb.com/docs/manual/reference/limits/#mongodb-limit-BSON-Document-Size for more information)
		maxFileSize: 12 * 1024 * 1024,
		// The authorized mime types for the images
		authorizedMimeTypes: [
			'image/jpeg',
			'image/png',
			'image/gif',
		],
		// The extensions of the authorized mime types
		mimeTypesExtensions: {
			'image/jpeg': 'jpg',
			'image/png': 'png',
			'image/gif': 'gif',
		},
		// The magics of the authorized mime types (the magics are used to verify the mime type of the image)
		magics: {
			jpeg: [255, 216, 255],
			png: [137, 80, 78],
			gif: [71, 73, 70],
		},
	},
};
