const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, 'Review can not be empty']
        },
        rating: {
            type: Number,
            required: [true, 'Review must have rating'],
            min: [1, 'Rating must be above 1.0'],
            max: [5, 'Rating must be below 5.0']
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        tour: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tour',
            required: [true, 'Review must belonging to a tour']
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Review must belonging to a user']
        }
    },
    {
        toJSON: { virtuals: true }, // options to use virtual properties
        toObject: { virtuals: true }
    }
);

reviewSchema.pre(/^find/, function(next) {
    // this.populate({
    //     path: 'tour',
    //     select: 'name'
    // }).populate({
    //     path: 'user',
    //     select: 'name photo'
    // });
    // next();

    this.populate({
        path: 'user',
        select: 'name photo'
    });
    next();
});

// this keyword pointing to current Model
reviewSchema.statics.calcAverageRatings = async function(tourId) {
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }
        },
        {
            $group: {
                _id: '$tour',
                numRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);
    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].numRating,
            ratingsAverage: stats[0].avgRating
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        });
    }
};

reviewSchema.index({ tour: 1, user: 1 }, { unique: true }); // unique (tour, user)

reviewSchema.post('save', function() {
    this.constructor.calcAverageRatings(this.tour); // this.constructor = Model(Class, Function Constructor)
});

// findByIdAndUpdate, findByIdAndDelete dont have access to document middleware, but query middleware
// but they trigger findOneAndUpdate, findOneAndDelete middleware

// can NOT change [pre] below to [post] because then query will be executed and it no longer exists
reviewSchema.pre(/^findOneAnd/, async function(next) {
    // this keyword is current query
    this.r = await this.findOne();
    next();
});
// this.r is [reviewQuery].[r property]
reviewSchema.post(/^findOneAnd/, async function() {
    // await this.findOne(); doest NOT work here, the query has already executed
    await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
