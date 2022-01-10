import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import { readFileSync, unlinkSync } from 'node:fs';
import ipaddr from 'ipaddr.js';
import formidable from 'formidable';
import mongooseConnection from './database/mongodbConnection.js';
import FileModel from './database/models/FileModel.js';
import config from './config.js';

dotenv.config({ path: '.env' });

mongooseConnection.init().then(() => {
	console.log('[MongoDB] Database connected successfully.');

	const not_found_image = readFileSync(config.image_uploader.notFoundImage.image_file_path);

	const app = express();

	app.use((req, res, next) => {
		req.ipAddress = ipaddr.process(req.socket.remoteAddress);
		console.log(`[Server] "${req.ipAddress.toString()}" requested "${req.protocol + '://' + req.get('host') + req.originalUrl} (${req.method})"`);
		next();
	});

	const basicAuthMiddleware = (req, res, next) => {
		const basicAuthorizationHeader = req.headers['authorization'];
		if (basicAuthorizationHeader) {
			const basicAuthorizationHeaderParts = basicAuthorizationHeader.split(' ');
			const basicToken = basicAuthorizationHeaderParts[1] || null;
			if (basicToken != process.env.API_TOKEN) {
				console.log(`[Server Auth] "${req.ipAddress.toString()}" tried to access "${req.protocol + '://' + req.get('host') + req.originalUrl} (${req.method})" with a invalid authorization.`);
				return res.status(403).json({ success: false, error: 'Invalid token.' });
			}
			next();
		}
		else {
			console.log(`[Server Auth] "${req.ipAddress.toString()}" tried to access "${req.protocol + '://' + req.get('host') + req.originalUrl} (${req.method})" without authorization.`);
			res.status(400).json({ success: false, error: 'Authorization header is missing.' });
		}
	};

	const form = formidable({
		allowEmptyFiles: false,
		maxFileSize: config.image_uploader.max_file_size_mb,
		maxFields: 1,
		maxFieldsSize: config.image_uploader.max_file_size_mb,
		hashAlgorithm: 'sha512',
		multiples: false,
		filter: ({ mimetype }) => mimetype && config.image_uploader.authorized_mime_types.includes(mimetype),
	});

	app.post('/api/upload/image', basicAuthMiddleware, (req, res) => {
		form.parse(req, (err, fields, files) => {
			if (err) return res.status(400).json({ error: err.message });
			if (!files.image || !files.image[0]) return res.status(400).json({ success: false, error: 'No file was uploaded.' });
			const file = files.image[0];

			const file_buffer = readFileSync(file.filepath);
			unlinkSync(file.filepath);

			FileModel.findOne({ file_hash: file.hash }).exec().then(fileData => {
				if (fileData) return res.status(200).json({ success: true, data: { already_exists: true, id: fileData.public_id } });

				const uint8a = Uint8Array.from(file_buffer).slice(0, 3);
				if (!JSON.stringify(Object.values(config.image_uploader.magics)).includes(JSON.stringify([uint8a[0], uint8a[1], uint8a[2]]))) return res.status(400).json({ success: false, error: 'File is not an image.' });

				const newFile = new FileModel({
					_id: mongoose.Types.ObjectId(),
					file_hash: file.hash,
					file_buffer: file_buffer,
					file_size: file.size,
					file_original_name: file.originalFilename,
					file_mime_type: file.mimetype,
					uploaded_by: req.ipAddress.toString(),
				});

				newFile.save().then(newImageFileData => {
					console.log(`[Server] "${req.ipAddress.toString()}" uploaded "${file.originalFilename} (${newImageFileData.public_id})" ("${file.size}" bytes)`);
					return res.status(200).json({ success: true, data: { already_exists: false, id: newImageFileData.public_id } });
				}).catch(err => {
					console.error(err);
					return res.status(500).json({ success: false, error: 'Internal server error.' });
				});
			}).catch(err => {
				console.error(err);
				return res.status(500).json({ success: false, error: 'Internal server error.' });
			});
		});
	});

	app.get('/:id', (req, res) => {
		FileModel.findOne({ public_id: req.params.id }).exec().then(imageFileData => {
			if (!imageFileData) {
				res.set('Content-Type', config.image_uploader.notFoundImage['Content-Type']);
				return res.send(not_found_image);
			}
			console.log(`[Server] "${req.ipAddress.toString()}" requested to view "${imageFileData.public_id} (${imageFileData.file_original_name})"`);
			res.setHeader('Content-Type', imageFileData.file_mime_type);
			res.send(imageFileData.file_buffer);

			imageFileData.views++;
			imageFileData.last_viewed_by = req.ipAddress.toString();
			imageFileData.last_viewed_at = Date.now();
			imageFileData.save().catch(console.error);
		}).catch(err => {
			console.error(err);
			return res.status(500).json({ success: false, error: 'Internal server error.' });
		});
	});

	app.listen(process.env.SERVER_PORT, process.env.SERVER_HOSTNAME, () => {
		console.log(`[Server] Server is running on "${process.env.SERVER_HOSTNAME}:${process.env.SERVER_PORT}"`);
	});
}).catch(console.error);