export default {
	// https://mongoosejs.com/docs/api.html#mongoose_Mongoose-connect
	mongooseConnectOptions: {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true,
		useFindAndModify: false,
		autoIndex: false,
		poolSize: 10,
		serverSelectionTimeoutMS: 5000,
		socketTimeoutMS: 45000,
		family: 4,
	},
	fileHash: {
		// Available options: 'md5', 'sha1' and 'sha256'
		algorithm: 'md5',
		// Available options: 'hex' and 'base64'
		digestMethod: 'hex',
	},
	// Current value: 5mb //For multipart forms, the max file size (in bytes)
	maxFileSize: 5e+6,
	// https://www.npmjs.com/package/ms //Default value used for the expiration of the file in the database if it is not specified.
	defaultExpiration: '30 days',
	notFoundImage: {
		path: './404.png',
		// PNG: 'image/png' | JPG: 'image/jpeg' | Other: see https://developer.mozilla.org/fr/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
		'Content-Type': 'image/png',
	},
	errorMessages: {
		hashGenerationFailed: 'Hash generation failed',
		fileFormatIsIncorrect: 'File format is incorrect',
		forbidden_invalid_token: 'You are not allowed to upload an image.',
		forbidden_token_not_specified: 'You must specify an authentication token!',
		noFile: 'No file to upload',
		emptyFile: 'Your file is empty :ç',
		fileTypeIncorrect: 'File type is incorrect',
		expirationHeaderInvalid: 'The expiration parameter is not valid! (valid values may be: "15 min", "30 days", "2y", 60000)',
	},
};