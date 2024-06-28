const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Handle synchronous uncaught exception code
process.on('uncaughtException', err => {
    console.log('UNCATCH EXCEPTION, application shutting down..');
    console.log(err.name, err.message);

    process.exit(1);
});

dotenv.config({ path: './config.env' }); // Config environment variables of process in config.env
const app = require('./app');

const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
);

mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    })
    .then(() => console.log('DB connection successful!'));

// ROUTE LISTENER
const port = process.env.PORT || 3000;
const server = app.listen(port, err => {
    if (err) console.log(err);
    else console.log(`App running on port ${port}`);
});

// Handle asynchronous unhandled promise rejection code
process.on('unhandledRejection', err => {
    console.log('UNHANDLE REJECTION, application shutting down..');
    console.log(err.name, err.message);

    server.close(() => {
        process.exit(1);
    });
});
