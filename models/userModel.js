const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name']
    },
    email: {
        type: String,
        required: [true, 'Please tell us your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    photo: String,
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide your password'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            validator: function(el) {
                return el === this.password;
            }
        },
        message: 'Passwords are not the same'
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

//Automatically encrypt the password before save the doccument
userSchema.pre('save', async function(next) {
    //run before save or create function
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12); // -->encrypt password
    this.passwordConfirm = undefined; // --> actually not stored in the database

    next();
});

// // Automatically change passwordChangedAt properties before save doccument
userSchema.pre('save', async function(next) {
    if (!this.isModified('password') || this.isNew) return next();
    this.passwordChangedAt = Date.now() - 1000;
    //Make sure that passwordChangedAtTimestamp is create before the tokenTimeExpireStamp
    next();
});

// Any string start with find
userSchema.pre(/^find/, function(next) {
    this.find({ active: { $ne: false } });
    next();
});

// instance method: available on all instace of model
// Check valid correction?
userSchema.methods.correctPassword = async function(
    candidatePassword,
    userPassword
) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

// Check if password has been change?
userSchema.methods.changePasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimeStamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );
        console.log(changedTimeStamp, JWTTimestamp); // second, milisecond
        return JWTTimestamp < changedTimeStamp;
    }
    // FALSE: NOT CHANGED
    return false;
};
// Create a random token for reset password
userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10min=600 000 ms

    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
