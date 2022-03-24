import { readFileSync, unlinkSync } from 'node:fs';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import contentDisposition from 'content-disposition';
import ipaddr from 'ipaddr.js';
import formidable from 'formidable';
import expressRateLimit from 'express-rate-limit';
import mongooseConnection from './database/mongodbConnection.js';
import FileModel from './database/models/FileModel.js';
import config from './config.js';
import log from './utils/functions/log.js';

dotenv.config({ path: '.env' });

const imgCache = new Map();

mongooseConnection.init().then(() => {
	log('MongoDB', 'Database connected successfully');

	const not_found_image = readFileSync(config.imageUploader.notFoundImage.imageFilePath);

	const app = express();

	let reqId = 0;
	app.use((req, res, next) => {
		req.id = reqId;
		reqId++;
		req.ipAddress = ipaddr.process(config.server.usingCloudflare ? req.headers['cf-connecting-ip'] || req.socket.remoteAddress : req.socket.remoteAddress);
		if (req.path.startsWith('/check') && config.server.disableLogRequestsOnCheckRoute) return next();
		log('Server', `"${req.ipAddress.toString()}" requested "${req.protocol}://${req.get('host')}${req.path} [${req.method}]" (req-id: "${req.id}")`);
		next();
	});

	const basicAuthMiddleware = (req, res, next) => {
		const basicAuthorizationHeader = req.headers['authorization'];
		if (basicAuthorizationHeader) {
			const basicAuthorizationHeaderParts = basicAuthorizationHeader.split(' ');
			const basicToken = basicAuthorizationHeaderParts[1] || null;
			if (basicToken != process.env.API_TOKEN) {
				log('Server Auth', `"${req.ipAddress.toString()}" tried to access "${req.protocol}://${req.get('host')}${req.path} [${req.method}]" with a invalid authorization (req-id: "${req.id}")`);
				return res.status(403).json({ success: false, error: 'Invalid token.' });
			}
			next();
		}
		else {
			log('Server Auth', `"${req.ipAddress.toString()}" tried to access "${req.protocol}://${req.get('host')}${req.path} [${req.method}]" without authorization (req-id: "${req.id}")`);
			res.status(400).json({ success: false, error: 'Authorization header is missing.' });
		}
	};

	const form = formidable({
		allowEmptyFiles: false,
		maxFileSize: config.imageUploader.maxFileSizeMb,
		maxFields: 1,
		maxFieldsSize: config.imageUploader.maxFileSizeMb,
		hashAlgorithm: 'sha512',
		multiples: false,
		filter: ({ mimetype }) => mimetype && config.imageUploader.authorizedMimeTypes.includes(mimetype),
	});

	form.setMaxListeners(0);

	const uploadRateLimiter = expressRateLimit({
		windowMs: config.imageUploader.rateLimiter.windowMs,
		max: config.imageUploader.rateLimiter.max,
		keyGenerator: req => req.ipAddress.toString(),
		handler: (req, res) => {
			log('Server Rate Limiter', `"${req.ipAddress.toString()}" tried to access "${req.protocol}://${req.get('host')}${req.path} [${req.method}]" but get rate limited (req-id: "${req.id}")`);
			res.status(429).json({ success: false, error: 'Too many requests.' });
		},
	});

	if (config.server.enableCheckRoute) {
		app.get('/check', (req, res) => {
			res.sendStatus(200);
		});
	}

	app.post('/api/upload/image', uploadRateLimiter, basicAuthMiddleware, (req, res) => {
		form.parse(req, (err, fields, files) => {
			if (err) return res.status(400).json({ success: false, error: err.message });
			if (!files.image || !files.image[0]) return res.status(400).json({ success: false, error: 'No file was uploaded or the file is incorrect.' });
			const file = files.image[0];

			const file_buffer = readFileSync(file.filepath);
			unlinkSync(file.filepath);

			const uint8a = Uint8Array.from(file_buffer).slice(0, 3);
			if (!JSON.stringify(Object.values(config.imageUploader.magics)).includes(JSON.stringify([uint8a[0], uint8a[1], uint8a[2]]))) return res.status(400).json({ success: false, error: 'File is not an image.' });

			FileModel.findOne({ file_hash: file.hash }).exec().then(fileData => {
				if (fileData) return res.status(200).json({ success: true, data: { already_exists: true, id: fileData.public_id, id_with_extension: `${fileData.public_id}.${config.imageUploader.mimeTypesExtensions[fileData.file_mime_type]}` } });

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
					imgCache.set(newImageFileData.public_id, newImageFileData);
					setTimeout(() => {
						newImageFileData.save().catch(() => null);
						imgCache.delete(newImageFileData.public_id);
					}, config.imageUploader.cacheTimeMs);
					log('Server', `"${req.ipAddress.toString()}" uploaded "${file.originalFilename} (${newImageFileData.public_id})" ("${file.size}" bytes, req-id: "${req.id}")`);
					return res.status(200).json({ success: true, data: { already_exists: false, id: newImageFileData.public_id, id_with_extension: `${newImageFileData.public_id}.${config.imageUploader.mimeTypesExtensions[file.mimetype]}` } });
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
		let id = req.params.id;
		if (id.split('.').length > 0) id = id.split('.')[0];

		function handle(imageFileData, fromCache = false) {
			res.set('Content-Type', imageFileData.file_mime_type);
			res.set('Content-Disposition', contentDisposition(imageFileData.file_original_name, {
				type: 'inline',
			}));
			res.send(imageFileData.file_buffer);

			log('Server', `"${req.ipAddress.toString()}" viewed "${imageFileData.public_id} (${imageFileData.file_original_name})" (loaded from cache: "${fromCache}", req-id: "${req.id}")`);

			imageFileData.views++;
			imageFileData.last_viewed_by = req.ipAddress.toString();
			imageFileData.last_viewed_at = Date.now();
		}

		const cachedImageFileData = imgCache.get(id);
		if (cachedImageFileData) return handle(cachedImageFileData, true);

		FileModel.findOne({ public_id: id }).exec().then(imageFileData => {
			if (!imageFileData) {
				res.set('Content-Type', config.imageUploader.notFoundImage['Content-Type']);
				return res.status(404).send(not_found_image);
			}
			imgCache.set(imageFileData.public_id, imageFileData);
			setTimeout(() => {
				imageFileData.save().catch(() => null);
				imgCache.delete(imageFileData.public_id);
			}, config.imageUploader.cacheTimeMs);
			handle(imageFileData);
		}).catch(err => {
			console.error(err);
			return res.status(500).json({ success: false, error: 'Internal server error.' });
		});
	});

	app.listen(process.env.SERVER_PORT, process.env.SERVER_HOSTNAME, () => {
		log('Server', `Server is running on "${process.env.SERVER_HOSTNAME}:${process.env.SERVER_PORT}"`);
		if (config.server.startupMessage) console.log(config.server.startupMessage);
	});
}).catch(console.error);
