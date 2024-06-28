const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors'); // Enable CORS
const cookieParser = require('cookie-parser');

const AppError = require('./ultils/appError');
const globalErrorHandler = require('./controllers/errorController.js');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRouter');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//  give access to public static folder
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());

// GLOBAL MIDDLEWARES
// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev')); // Display equest information in the console
}
// Limit the requests from the same IP
const limiter = rateLimit({
    max: 100, // max Number of request
    windowMs: 60 * 60 * 1000, // 1hour per max number of request,
    message: 'Too many requests from this IP, please try again later'
});

app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // Parsing data from a urlencoded form request
app.use(cookieParser());

// Data sanitization against NOSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xssClean());

// Prevent parameter pollution
app.use(
    hpp({
        whitelist: [
            'duration',
            'ratingsQuantity',
            'ratingAverage',
            'maxGroupSize',
            'difficulty',
            'price'
        ]
    })
);

// request---------middleware(even routers) stack----->response

// just for testing
// app.use((req, res, next) => {
//     console.log(req.cookies);
//     next();
// });

// ROUTERS

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
    // const err = new Error(`Cannot find ${req.originalUrl} on this request`);
    // err.status = 'fail';
    // err.statusCode = 404;
    next(new AppError(`Cannot find ${req.originalUrl} on this request`, 404));
    // skip all other middlewares in the stack and jump right into error handling middleware and sendback response
});

// ERROR HANDLING MIDDLEWARE
app.use(globalErrorHandler);

module.exports = app;
