const AppError = require('../utils/AppError');

// ─── Mongoose Duplicate Key Error ────────────────────────────────────────────
const handleDuplicateKeyError = (err) => {
    const field = Object.keys(err.keyValue)[0];
    return new AppError(`Duplicate value for field '${field}'. Please use another value.`, 409);
};

// ─── Mongoose Validation Error ───────────────────────────────────────────────
const handleValidationError = (err) => {
    const errors = Object.values(err.errors).map((e) => e.message);
    return new AppError(`Validation failed: ${errors.join('. ')}`, 422);
};

// ─── Mongoose Cast Error (invalid ObjectId) ──────────────────────────────────
const handleCastError = (err) => {
    return new AppError(`Invalid value '${err.value}' for field '${err.path}'.`, 400);
};

// ─── JWT Errors ──────────────────────────────────────────────────────────────
const handleJWTError = () => new AppError('Invalid token. Please log in again.', 401);
const handleJWTExpiredError = () => new AppError('Your session has expired. Please log in again.', 401);

// ─── Development Error Response ──────────────────────────────────────────────
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        success: false,
        status: err.status,
        message: err.message,
        stack: err.stack,
        error: err,
    });
};

// ─── Production Error Response ───────────────────────────────────────────────
const sendErrorProd = (err, res) => {
    if (err.isOperational) {
        // Trusted, operational errors: send message to client
        res.status(err.statusCode).json({
            success: false,
            status: err.status,
            message: err.message,
        });
    } else {
        // Programming/unknown errors: don't leak details
        console.error('💥 UNEXPECTED ERROR:', err);
        res.status(500).json({
            success: false,
            status: 'error',
            message: 'Something went wrong. Please try again later.',
        });
    }
};

// ─── Global Error Handler Middleware ─────────────────────────────────────────
const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else {
        let error = { ...err, message: err.message };

        if (err.code === 11000) error = handleDuplicateKeyError(err);
        if (err.name === 'ValidationError') error = handleValidationError(err);
        if (err.name === 'CastError') error = handleCastError(err);
        if (err.name === 'JsonWebTokenError') error = handleJWTError();
        if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, res);
    }
};

module.exports = globalErrorHandler;
