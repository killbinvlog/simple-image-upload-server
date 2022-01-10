import mongoose from 'mongoose';

const Schema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	hash: {
		type: String,
		required: true,
	},
	originalname: String,
	file: {
		type: Buffer,
		required: true,
	},
	mimetype: {
		type: String,
		required: true,
	},
	lastViewedAt: {
		type: Date,
		default: null,
	},
	lastUpdatedAt: {
		type: Date,
		default: null,
	},
	createdAt: {
		type: Date,
		require: true,
	},
	uploadedBy: String,
	expireAt: Date,
});


export default mongoose.model('Image', Schema);