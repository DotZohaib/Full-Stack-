const AppError = require('./../ultils/appError');

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400); // bad request
};
const handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
    const message = `Duplicate field value: ${value} Please use another value.`;
    return new AppError(message, 400);
};
const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);

    const message = `Invalid input data ${errors.join('. ')}`;
    return new AppError(message, 400);
};
const handleJWTError = () =>
    new AppError('Invalid token. Please login again.', 401);
const handleJWTExpired = () =>
    new AppError('Your token has expired! Please login again.', 401);

const sendErrorDev = (err, req, res) => {
    // TESTING API
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    }
    // RENDER WEBSITE
    console.error('ERROR: ', err);
    return res.status(err.statusCode).render('error', {
        title: 'Something went very wrong!',
        msg: err.message
    });
};
const sendErrorProd = (err, req, res) => {
    /// TESTING API
    if (req.originalUrl.startsWith('/api')) {
        // Operational, trusted
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        }
        // Programming or other unknown error: dont leak error details
        console.error('ERROR: ', err);

        return res.status(500).json({
            status: 'Error',
            message: 'Something went wrong!'
        });
    }

    /// RENDERING WEBSITE
    if (err.isOperational) {
        return res.status(err.statusCode).render('error', {
            title: 'Something went very wrong!',
            msg: err.message
        });
    }
    return res.status(err.statusCode).render('error', {
        title: 'Something went very wrong!',
        msg: 'Please try again later.'
    });
};

module.exports = (err, req, res, next) => {
    //console.log(err.stack);

    console.log(err);
    err.statusCode = err.statusCode || 500; //internal servel error
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {
        console.log(err);
        let error = { ...err };
        error.message = err.message;

        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError')
            error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleJWTExpired();
        sendErrorProd(error, req, res);
    }
};
