import contentDisposition from 'content-disposition';
import dotenv from 'dotenv';
import express from 'express';
import formidable from 'formidable';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import config from './config.js';
import connectDb from './database/connectDb.js';
import FileModel from './database/models/FileModel.js';
import authMiddleware from './middlewares/authMiddleware.js';
import initRequestMiddleware from './middlewares/initRequestMiddleware.js';
import uploadRateLimiterMiddleware from './middlewares/rate-limiters/uploadRateLimiterMiddleware.js';
import viewRateLimiterMiddleware from './middlewares/rate-limiters/viewRateLimiterMiddleware.js';
import requestLogMiddleware from './middlewares/requestLogMiddleware.js';
import log from './utils/functions/log.js';

dotenv.config({ path: '.env' });

connectDb(config.mongodb.connectionOptions).then(() => {
	log('MongoDB', `Database is successfully connected on ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);

	const imgCache = new Map();

	function addToCache(fileData) {
		imgCache.set(fileData.public_id, fileData);
		setTimeout(() => {
			fileData.save().catch(err => console.error(new Error('Error while saving image file data to database from cache', { cause: err })));
			imgCache.delete(fileData.public_id);
		}, config.imageUploader.cacheTimeMs);
	}

	const notFoundImage = readFileSync(config.imageUploader.notFoundImage.imageFilePath);

	const app = express();

	app.use(helmet(), initRequestMiddleware, requestLogMiddleware);

	const form = formidable({
		allowEmptyFiles: false,
		maxFileSize: config.imageUploader.maxFileSize,
		maxFields: 1,
		maxFieldsSize: config.imageUploader.maxFileSize,
		hashAlgorithm: 'sha512',
		multiples: false,
		filter: ({ mimetype }) => mimetype && config.imageUploader.authorizedMimeTypes.includes(mimetype),
	});

	form.setMaxListeners(0);

	if (config.server.enableCheckRoute) {
		app.get('/check', (req, res) => {
			res.sendStatus(200);
		});
	}

	const { imageUploader: { formDataFieldName } } = config;
	app.post('/upload/image', uploadRateLimiterMiddleware, authMiddleware, (req, res) => {
		form.parse(req, (err, fields, files) => {
			if (err) return res.status(400).json({ success: false, error: err.message });
			if (!files[formDataFieldName] || !files[formDataFieldName][0]) return res.status(400).json({ success: false, error: 'No file was uploaded or the file is incorrect.' });
			const file = files[formDataFieldName][0];

			const fileBuffer = readFileSync(file.filepath);
			unlinkSync(file.filepath);

			const uint8a = Uint8Array.from(fileBuffer).slice(0, 3);
			if (!JSON.stringify(Object.values(config.imageUploader.magics)).includes(JSON.stringify([uint8a[0], uint8a[1], uint8a[2]]))) return res.status(400).json({ success: false, error: 'File is not an image.' });

			FileModel.findOne({ file_hash: file.hash }).exec().then(fileData => {
				if (fileData) return res.status(200).json({ success: true, data: { already_exists: true, id: fileData.public_id, id_with_extension: `${fileData.public_id}.${config.imageUploader.mimeTypesExtensions[fileData.file_mime_type]}` } });

				const newFile = new FileModel({
					_id: mongoose.Types.ObjectId(),
					file_hash: file.hash,
					file_buffer: fileBuffer,
					file_size: file.size,
					file_original_name: file.originalFilename,
					file_mime_type: file.mimetype,
					uploaded_by: req.ipAddress.toString(),
				});

				newFile.save().then(newImageFileData => {
					addToCache(newImageFileData);
					log('Server', `${req.ipAddress} uploaded ${file.originalFilename} (file-size: ${file.size}B, public-id: ${newImageFileData.public_id}, req-id: ${req.id})`);
					return res.status(200).json({ success: true, data: { already_exists: false, id: newImageFileData.public_id, id_with_extension: `${newImageFileData.public_id}.${config.imageUploader.mimeTypesExtensions[file.mimetype]}` } });
				}).catch(err => {
					console.error(new Error('Error while saving image file data to database', { cause: err }));
					return res.status(500).json({ success: false, error: 'Internal server error.' });
				});
			}).catch(err => {
				console.error(new Error('Error while getting image file data from database', { cause: err }));
				return res.status(500).json({ success: false, error: 'Internal server error.' });
			});
		});
	});

	const publicPath = path.join(process.cwd(), 'public');
	if (existsSync(publicPath)) app.use('/', express.static(publicPath));

	app.get('/:id', viewRateLimiterMiddleware, (req, res) => {
		let id = req.params.id;
		if (id.split('.').length > 0) id = id.split('.')[0];

		function handle(imageFileData, fromCache = false) {
			res.set('Content-Type', imageFileData.file_mime_type);
			res.set('Content-Disposition', contentDisposition(imageFileData.file_original_name, {
				type: 'inline',
			}));
			res.send(imageFileData.file_buffer);

			log('Server', `${req.ipAddress} viewed ${imageFileData.public_id} (from-cache: ${fromCache}, req-id: ${req.id})`);

			imageFileData.views++;
			imageFileData.last_viewed_by = req.ipAddress.toString();
			imageFileData.last_viewed_at = Date.now();
		}

		const cachedImageFileData = imgCache.get(id);
		if (cachedImageFileData) return handle(cachedImageFileData, true);

		FileModel.findOne({ public_id: id }).exec().then(imageFileData => {
			if (!imageFileData) {
				res.set('Content-Type', config.imageUploader.notFoundImage['Content-Type']);
				return res.status(404).send(notFoundImage);
			}
			addToCache(imageFileData);
			handle(imageFileData);
		}).catch(err => {
			console.error(new Error('Error while getting image file data from database', { cause: err }));
			return res.status(500).json({ success: false, error: 'Internal server error.' });
		});
	});

	app.listen(process.env.SERVER_PORT, process.env.SERVER_HOSTNAME, () => {
		log('Server', `Server is running on ${process.env.SERVER_HOSTNAME}:${process.env.SERVER_PORT}`);
		if (config.server.startupMessage) console.log(config.server.startupMessage);
	});
}).catch(err => console.error(new Error('Error while initializing server', { cause: err })));
