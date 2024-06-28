const { promisify } = require('util');
const cryto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../ultils/catchAsync');
const AppError = require('./../ultils/appError');
const sendEmail = require('./../ultils/email');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true // can NOT manipulate the cookies in the browser
    };

    if (process.env.NODE_ENV === 'production') {
        cookieOptions.secure = true;
    }
    res.cookie('jwt', token, cookieOptions);

    // Remove the password from the output
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role
    });
    createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1. Check if email and password exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password!', 400));
    }

    // 2. Check the user exits && password is correct
    const user = await User.findOne({ email }).select('+password'); // + mean: overriding Select: false option in User Model, now include password in selected fields

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    // 3. If everything is ok send token to the client
    createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedOut', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
    // 1. Getting the token and check if it's exists
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    //console.log(token);

    if (!token) {
        return next(
            new AppError(
                'You are not logged in! Please log in to get access.',
                401
            )
        );
    }

    // 2. Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    //console.log(decoded);

    // 3. Check the user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(
            new AppError(
                'The user belonging to this token does no longer exist',
                401
            )
        );
    }

    // 4. Check if the user change password after the token was issued
    if (currentUser.changePasswordAfter(decoded.iat)) {
        return next(
            new AppError(
                'User recently changed password! Please log in again',
                401
            )
        );
    }
    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    res.locals.user = currentUser; // res.locals <-- pug template will have access to this
    next();
});

// Check if user has already loggined, used for rendering view
exports.isLoggedIn = async (req, res, next) => {
    // 1. Getting the token and check if it's exists
    if (req.cookies.jwt) {
        try {
            // 2. Verification token
            const decoded = await promisify(jwt.verify)(
                req.cookies.jwt,
                process.env.JWT_SECRET
            );
            //console.log(decoded);

            // 3. Check the user still exists
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                return next();
            }

            // 4. Check if the user change password after the token was issued
            if (currentUser.changePasswordAfter(decoded.iat)) {
                return next();
            }
            // THERE IS A LOGGINED USER
            res.locals.user = currentUser; // res.locals <-- pug template will have access to this object
            return next();
        } catch (e) {
            return next();
        }
    }
    next();
};

// Using closures
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles ['admin', 'lead-guide']
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError(
                    'You do not have permission to perform this action',
                    403 // forbidded
                )
            );
        }

        next();
    };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1. Get user based in POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(
            new AppError('There is no user with the email address.', 404)
        );
    }

    // 2. Generate a random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false }); // Save changes to the database

    // 3. Send it to the user's email
    const resetURL = `${req.protocol}://${req.get(
        'host'
    )}/api/v1/resetPassword/${resetToken}`;
    const message = `Forgot your password? Submit a PATCH request with your new password and confirm password to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token (valid in 10 mins)',
            message
        });

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email'
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false }); // Save changes to the database

        return next(
            new AppError(
                'There was an error sending the email. Try again later!',
                500
            )
        );
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1. Get user based on the token
    const hashedToken = cryto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    // 2. If token has not expired, and there is a user, set the new password
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save(); // default run validator to validate password validation;

    // 3. Update changedPasswordAt property for the user

    // 4. Log the user in and send JWT
    createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1. Get user from collection

    const { password, newPassword, passwordConfirm } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
        return next(
            new AppError(
                'This user has no longer existed! Please try again!',
                404
            )
        );
    }

    // 2. Check if POSTed password is correct
    if (!(await user.correctPassword(password, user.password))) {
        return next(
            new AppError(
                'The password provided is not correct! Please try again',
                401
            )
        );
    }
    if (!newPassword || !passwordConfirm) {
        return next(new AppError('Please provide new password!', 404));
    }

    // 3. If so, update password
    user.password = newPassword;
    user.passwordConfirm = passwordConfirm;
    await user.save();

    // 4. Login user in, send JWT
    createSendToken(user, 200, res);
});
