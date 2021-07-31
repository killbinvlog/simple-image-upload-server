require('dotenv').config({ path: '.env' });

const fileModel = require('./mongodb/FileModel');

const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const ipaddr = require('ipaddr.js');
const ms = require('ms');
const crypto = require('crypto');
const multer = require('multer');

const temp = new Map();

function generateFileHash(fileBuffer) {
    return new Promise((resolve, reject) => {
        let shasum = crypto.createHash('md5');
        try {
            shasum.update(fileBuffer);
            const hash = shasum.digest('hex');
            return resolve(hash);
        } catch (error) {
            return reject('Hash generation failed');
        }
    });
}

const app = express();
app.enable('trust proxy');

require('./mongodb/mongoose').init().then(() => {
    setInterval(() => {
        fileModel.find({}, 'expireAt originalname hash', { maxTimeMS: (1000*60)*2 }).exec().then(res => {
            let rm = 0;
            res.forEach(file => {
                if (file.expireAt && file.expireAt - Date.now() <= 0) {
                    fileModel.deleteOne(file, (err) => {
                        if (err) console.log(err);
                        rm++;
                    });
                }
            });
        });
    }, (1000*60)*2);

    const upload = multer({
        dest: 'temp',
        limits: {
            fileSize: 20000000 // 16mb
        },
        fileFilter: (req, file, cb) => {
            if (file.mimetype.startsWith('image/')) {
                return cb(null, true);
            } else {
                return cb(new Error('File format is incorrect'));
            }
        }
    });

    app.post('/upload/image', (req, res, next) => {
        req.addressIp = ipaddr.process(req.ip);
        const bearerHeader = req.headers['authorization'];
        if (bearerHeader) {
            const bearer = bearerHeader.split(' ');
            const bearerToken = bearer[1];
            if (bearerToken !== process.env.API_TOKEN) {
                console.log(`[Authentication] => Access denied for a request from the ip '${req.addressIp}'`);
                return res.status(403).json({ error: { message: 'You are not allowed to upload an image.' } });
            }
            next();
        } else {
            console.log(`[Authentication] => Access denied for a request from the ip '${req.addressIp}'`);
            res.status(400).json({ error: { message: 'You must specify an authentication token!' } });
        }
    }, upload.single('image'), async (req, res) => {
        if (!req.file) return res.status(400).json({ error: { message: 'No file to upload' } });
        const file = req.file;
        const buffer = await fs.readFileSync(`./temp/${file.filename}`);
        fs.unlinkSync(`./temp/${file.filename}`);
        if (buffer.length < 1) return res.status(400).json({ error: { message: 'Your file is empty :ç' } });
        const magics = {
            jpg: [255, 216, 255],
            png: [137, 80, 78],
            gif: [71, 73, 70]
        }
        const uint8a = Uint8Array.from(buffer).slice(0, 3);
        if (!JSON.stringify(Object.values(magics)).includes(JSON.stringify([uint8a[0], uint8a[1], uint8a[2]]))) return res.status(400).json({ error: { message: 'File type is incorrect' } });
        generateFileHash(buffer).then(async hash => {
            const data = await fileModel.findOne({ hash: hash });

            let date = new Date();
            if (req.headers['expires']) {
                if (typeof req.headers['expires'] === 'number') {
                    date.setMilliseconds(parseInt(date.getMilliseconds() + req.headers['expires']));
                } else {
                    if (!ms(req.headers['expires'])) return res.status(400).json({ error: { message: 'The expiration parameter is not valid!' } });
                    date.setMilliseconds(date.getMilliseconds() + ms(req.headers['expires']));
                }
            } else {
                date.setMonth(date.getMonth() + 1);
            }

            if (data) {
                temp.set(hash, data);
                res.status(200).json({ id: data.hash });
                data.expireAt = date;
                data.lastUpdatedAt = new Date();
                data.save();
            } else {
                const merged = Object.assign({
                    _id: mongoose.Types.ObjectId(),
                    hash: hash,
                    originalname: file.originalname,
                    file: buffer,
                    mimetype: file.mimetype,
                    lastUpdatedAt: new Date(),
                    createdAt: new Date(),
                    uploadedBy: req.addressIp,
                    expireAt: date
                });
                const upl = new fileModel(merged);
                upl.save().then(data => {
                    temp.set(hash, data);
                    console.log(`[Server] => Image '${file.originalname}', '${hash}' has been created by '${req.addressIp}'`);
                    res.status(200).json({ id: hash });
                });
            }
            setTimeout(() => {
                temp.delete(hash);
            }, ((1000*60)*60)*3);
        }).catch(e => {
            res.status(500).json({ error: { message: e.message } });
        });
    }, (err, req, res, next) => {
        res.status(400).json({ error: { message: err.message } });
    });

    function renderImage(req, res) {
        function display(data) {
            const ip = ipaddr.process(req.headers['cf-connecting-ip'] || req.ip);
            console.log(`[Server] => Image '${data.originalname}', '${data.hash}' has been viewed by '${ip}'`);
            res.set('Content-Type', data.mimetype);
            res.send(data.file);
            if (!temp.has(data.hash)) {
                temp.set(data.hash, data);
                setTimeout(() => {
                    temp.delete(data.hash);
                }, ((1000*60)*60)*3);
            }
            fileModel.findOne({ hash: data.hash }).then(fileData => {
                if (!fileData) return;
                fileData.lastViewedAt = new Date();
                fileData.save();
            });
        }

        const hash = req.params.hash;

        if (temp.has(hash)) {
            display(temp.get(hash));
        } else {
            fileModel.findOne({ hash: hash }).then(data => {
                if (data) {
                    display(data);
                } else {
                    const image = fs.readFileSync("./404.png");
                    res.set('Content-Type', 'image/png');
                    res.send(image);
                }
            });
        }
    }

    app.get('/view/:hash', renderImage);
    app.get('/v/:hash', renderImage);

    app.listen(process.env.PORT, () => {
        console.log(`[Server] => Server is running on port ${process.env.PORT}`);
    });
});
