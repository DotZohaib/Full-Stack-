const User = require('./../models/userModel');
const catchAsync = require('../ultils/catchAsync');
const AppError = require('./../ultils/appError');
const factory = require('./handlerFactory');

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
// do NOT update password with this
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

// Filter allowed fields from the request.body
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not yet defined! Please user /signup instead'
    });
};

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
    // 1. Create error if the user post password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError('This route is not for password updates', 400)
        );
    }
    // 2. Update user doccument
    // Filter out unwanted field names that are not allowed to be updated
    const filterBody = filterObj(req.body, 'name', 'email');

    const user = await User.findByIdAndUpdate(req.user.id, filterBody, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    console.log(req.user);
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
        // 204: Deleted
        status: 'Success',
        data: null
    });
});
