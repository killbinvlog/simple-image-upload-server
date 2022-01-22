import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import { readFileSync, unlinkSync } from 'node:fs';
import ipaddr from 'ipaddr.js';
import formidable from 'formidable';
import expressRateLimit from 'express-rate-limit';
import mongooseConnection from './database/mongodbConnection.js';
import FileModel from './database/models/FileModel.js';
import parse_date from './utils/functions/parse_date.js';
import config from './config.js';

dotenv.config({ path: '.env' });

const imgCache = new Map();

mongooseConnection.init().then(() => {
	console.log(`[${parse_date()}] [MongoDB] Database connected successfully`);

	const not_found_image = readFileSync(config.image_uploader.notFoundImage.image_file_path);

	const app = express();

	let reqId = 0;
	app.use((req, res, next) => {
		req.__id = reqId;
		reqId++;
		req.ipAddress = ipaddr.process(config.server.using_cloudflare ? req.headers['cf-connecting-ip'] || req.socket.remoteAddress : req.socket.remoteAddress);
		console.log(`[${parse_date()}] [Server] "${req.ipAddress.toString()}" requested "${req.protocol + '://' + req.get('host') + req.originalUrl} (${req.method})" (req-id: "${req.__id}")`);
		next();
	});

	const basicAuthMiddleware = (req, res, next) => {
		const basicAuthorizationHeader = req.headers['authorization'];
		if (basicAuthorizationHeader) {
			const basicAuthorizationHeaderParts = basicAuthorizationHeader.split(' ');
			const basicToken = basicAuthorizationHeaderParts[1] || null;
			if (basicToken != process.env.API_TOKEN) {
				console.log(`[${parse_date()}] [Server Auth] "${req.ipAddress.toString()}" tried to access "${req.protocol + '://' + req.get('host') + req.originalUrl} (${req.method})" with a invalid authorization (req-id: "${req.__id}")`);
				return res.status(403).json({ success: false, error: 'Invalid token.' });
			}
			next();
		}
		else {
			console.log(`[${parse_date()}] [Server Auth] "${req.ipAddress.toString()}" tried to access "${req.protocol + '://' + req.get('host') + req.originalUrl} (${req.method})" without authorization (req-id: "${req.__id}")`);
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

	form.setMaxListeners(0);

	const uploadRateLimiter = expressRateLimit({
		windowMs: config.image_uploader.rate_limiter.windowMs,
		max: config.image_uploader.rate_limiter.max,
		keyGenerator: req => req.ipAddress.toString(),
		handler: (req, res) => {
			console.log(`[${parse_date()}] [Server Rate Limiter] "${req.ipAddress.toString()}" tried to access "${req.protocol + '://' + req.get('host') + req.originalUrl} (${req.method})" but get rate limited (req-id: "${req.__id}")`);
			res.status(429).json({ success: false, error: 'Too many requests.' });
		},
	});

	if (config.server.enable_check_route) {
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
			if (!JSON.stringify(Object.values(config.image_uploader.magics)).includes(JSON.stringify([uint8a[0], uint8a[1], uint8a[2]]))) return res.status(400).json({ success: false, error: 'File is not an image.' });

			FileModel.findOne({ file_hash: file.hash }).exec().then(fileData => {
				if (fileData) return res.status(200).json({ success: true, data: { already_exists: true, id: fileData.public_id, id_with_extension: `${fileData.public_id}.${config.image_uploader.mime_types_extensions[fileData.file_mime_type]}` } });

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
					const handleDelete = () => {
						if (!newImageFileData.$isDeleted()) newImageFileData.save().catch(console.error);
						imgCache.delete(newImageFileData.public_id);
					};
					setTimeout(handleDelete, 15 * 60 * 1000);
					console.log(`[${parse_date()}] [Server] "${req.ipAddress.toString()}" uploaded "${file.originalFilename} (${newImageFileData.public_id})" ("${file.size}" bytes, req-id: "${req.__id}")`);
					return res.status(200).json({ success: true, data: { already_exists: false, id: newImageFileData.public_id, id_with_extension: `${newImageFileData.public_id}.${config.image_uploader.mime_types_extensions[file.mimetype]}` } });
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
			res.send(imageFileData.file_buffer);

			console.log(`[${parse_date()}] [Server] "${req.ipAddress.toString()}" viewed "${imageFileData.public_id} (${imageFileData.file_original_name})" (loaded from cache: "${fromCache}", req-id: "${req.__id}")`);

			imageFileData.views++;
			imageFileData.last_viewed_by = req.ipAddress.toString();
			imageFileData.last_viewed_at = Date.now();
		}

		const cachedImageFileData = imgCache.get(id);
		if (cachedImageFileData) return handle(cachedImageFileData, true);

		FileModel.findOne({ public_id: id }).exec().then(imageFileData => {
			if (!imageFileData) {
				res.set('Content-Type', config.image_uploader.notFoundImage['Content-Type']);
				return res.status(404).send(not_found_image);
			}
			imgCache.set(imageFileData.public_id, imageFileData);
			const handleDelete = () => {
				if (!imageFileData.$isDeleted()) imageFileData.save().catch(console.error);
				imgCache.delete(imageFileData.public_id);
			};
			setTimeout(handleDelete, 15 * 60 * 1000);
			handle(imageFileData);
		}).catch(err => {
			console.error(err);
			return res.status(500).json({ success: false, error: 'Internal server error.' });
		});
	});

	app.listen(process.env.SERVER_PORT, process.env.SERVER_HOSTNAME, () => {
		console.log(`[${parse_date()}] [Server] Server is running on "${process.env.SERVER_HOSTNAME}:${process.env.SERVER_PORT}"`);
	});
}).catch(console.error);