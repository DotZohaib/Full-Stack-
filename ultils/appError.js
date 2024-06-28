class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'; // 4xx: fail, 5xx: err
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor); // Create stack property on this object
    }
}

module.exports = AppError;
