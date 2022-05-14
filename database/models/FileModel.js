import mongoose from 'mongoose';
import config from '../../config.js';
import generateIdentifier from '../../utils/functions/generateIdentifier.js';

const Schema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	public_id: {
		type: String,
		default: () => generateIdentifier(config.imageUploader.identifiers.length, config.imageUploader.identifiers.chars),
		unique: true,
	},
	file_hash: {
		type: String,
		required: true,
	},
	file_buffer: {
		type: Buffer,
		required: true,
	},
	file_size: {
		type: Number,
		required: true,
	},
	file_original_name: {
		type: String,
		required: true,
	},
	file_mime_type: {
		type: String,
		required: true,
	},
	views: {
		type: Number,
		default: 0,
	},
	last_viewed_at: {
		type: Date,
		default: null,
	},
	last_viewed_by: {
		type: String,
		default: null,
	},
	created_at: {
		type: Date,
		expires: config.imageUploader.expires,
		default: Date.now,
	},
	updated_at: {
		type: Date,
		default: Date.now,
	},
	uploaded_by: {
		type: String,
		required: true,
	},
});

export default mongoose.model('File', Schema, config.mongodb.collectionName);
