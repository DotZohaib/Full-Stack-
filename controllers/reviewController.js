const Review = require('../models/reviewModel');
const catchAsync = require('../ultils/catchAsync');
const AppError = require('./../ultils/appError');
const factory = require('./handlerFactory');

exports.setTourAndUserId = (req, res, next) => {
    // Allow nested routes
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id; // get user from protect middle-ware
    next();
};

exports.checkReviewer = catchAsync(async (req, res, next) => {
    //req.user.id === review.id?
    const review = await Review.findById(req.params.id);
    console.log(req.user);

    if (req.user.role === 'admin') {
        return next();
    }
    if (!(req.user.id == review.user._id) && req.user.role === 'user') {
        return next(
            new AppError(
                "Only the review's owner or admin can delete the review",
                403
            )
        );
    }
    next();
});

exports.createReview = factory.createOne(Review);
exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
