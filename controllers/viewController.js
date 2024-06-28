const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const catchAsync = require('./../ultils/catchAsync');
const AppError = require('./../ultils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
    // Get all tours data from collection
    const tours = await Tour.find();

    // Build a template

    // Render that template using tour data from step 1
    res.status(200).render('overview', {
        title: 'All Tours',
        tours
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    // Get tour data from collection
    const tour = await Tour.findOne({ slug: req.params.name }).populate({
        path: 'reviews',
        fields: 'review rating user'
    });
    if (!tour) {
        return next(new AppError('There is no tour with that name', 404));
    }
    // Build the template

    // Render the template
    res.status(200).render('tour', {
        title: tour.name,
        tour
    });
});

exports.getLoginForm = (req, res) => {
    res.status(200).render('login', {
        title: 'Login'
    });
};

exports.getAccount = (req, res) => {
    res.status(200).render('account', {
        title: res.locals.user.name
    });
};

exports.updateUserData = catchAsync(async (req, res) => {
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
            name: req.body.name,
            email: req.body.email
        },
        {
            new: true, // return user updated
            runValidators: true
        }
    );

    res.status(200).render('account', {
        title: updatedUser.name,
        user: updatedUser
    });
});
