const mongoose = require('mongoose');

module.exports = {
    init: (options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false,
        autoIndex: false,
        poolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4
    }) => {
        return new Promise(resolve => {
            mongoose.connect(process.env.MONGODB_URI, options);
            mongoose.Promise = global.Promise;

            mongoose.connection.on('connected', () => {
                console.log('[MongoDB] => Database connected!');
                resolve(true);
            });
        });
    }
}
