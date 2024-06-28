const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');
// const User = require('./userModel');

const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'A tour must have a name'],
            unique: true,
            maxlength: [40, 'A tour name has maximum 40 characters'],
            minlength: [10, 'A tour name has minimum 10 characters']
            // ,validate: [
            //     validator.isAlpha,
            //     'Tour name must only contain character'
            // ]
        },
        slug: String,
        duration: {
            type: Number,
            required: [true, 'A tour must have a duration']
        },
        maxGroupSize: {
            type: Number,
            required: [true, 'A tour must have a group size']
        },
        difficulty: {
            type: String,
            required: [true, 'A tour must have a difficulty'],
            enum: {
                values: ['easy', 'medium', 'difficult'],
                message: 'Difficulty is ether: easy, medium, difficult'
            }
        },
        price: {
            type: Number,
            required: [true, 'A tour must have a price']
        },
        ratingsAverage: {
            type: Number,
            default: 4.5,
            min: [1, 'Rating must be above 1.0'],
            max: [5, 'Rating must be below 5.0'],
            set: val => Math.round(val * 10) / 10
        },
        ratingsQuantity: {
            type: Number,
            default: 0
        },
        priceDiscount: {
            type: Number,
            validate: {
                validator: function(val) {
                    // Only work when creating new document
                    return val < this.price && val < 0;
                },
                message:
                    'Discount price ({VALUE}) should be below regular price'
            }
        },
        summary: {
            type: String,
            trim: true
        },
        description: {
            type: String,
            trim: true,
            required: [true, 'A tour must have a description']
        },
        imageCover: {
            type: String,
            required: [true, 'A tour must havev a image']
        },
        images: [String], // An array of string
        createdAt: {
            type: Date,
            default: Date.now(), // Automatically converted to normal format,
            select: false
        },
        startDates: [Date],
        secretTour: {
            type: Boolean,
            default: false
        },
        // EMBEDDED DOCUMENT
        startLocation: {
            // GeoJSON
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number], // Latitude, longtidue
            address: String,
            description: String
        },
        locations: [
            {
                type: {
                    type: String,
                    default: 'Point',
                    enum: ['Point']
                },
                coordinates: [Number], // Latitude, longtidue
                address: String,
                description: String,
                day: Number
            }
        ],
        guides: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        ]
    },
    {
        toJSON: { virtuals: true }, // options to use virtual properties
        toObject: { virtuals: true }
    }
);

//tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function() {
    return this.duration / 7;
    // Use real function 'cause 'this' is need to be point to Tour instances
}); // virtual properties, not be stored in database

// Virtual populate
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour', // field in the foreign model (the ref model: Review),
    localField: '_id' // field in the current model(Tour)
});

/*
example 1: 
    const PersonSchema = new Schema({
    name: String,
    band: String
    });

    const BandSchema = new Schema({
    name: String
    });
    BandSchema.virtual('members', {
    ref: 'Person', // The model to use
    localField: 'name', // Find people where `localField`
    foreignField: 'band', // is equal to `foreignField`
    // If `justOne` is true, 'members' will be a single doc as opposed to
    // an array. `justOne` is false by default.
    justOne: false,
    options: { sort: { name: -1 }, limit: 5 } // Query options, see http://bit.ly/mongoose-query-options
    });

    Example 2:
    const userSchema = mongoose.Schema({ _id: Number, email: String });
    const blogPostSchema = mongoose.Schema({
    title: String,
    authorId: Number
    });
    // When you `populate()` the `author` virtual, Mongoose will find the
    // first document in the User model whose `_id` matches this document's
    // `authorId` property.
    blogPostSchema.virtual('author', {
    ref: 'User',
    localField: 'authorId',
    foreignField: '_id',
    justOne: true
    });
*/

// DOCUMENT MIDDLEWARE
// pre middleware: run before .save() and .create()
tourSchema.pre('save', function(next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

// tourSchema.pre('save', async function(next) {
//     const guidesPromises = this.guides.map(async id => await User.findById(id)); //  Actually return an array full of promises
//     this.guides = await Promise.all(guidesPromises);
//     next();
// });

// tourSchema.pre('save', function(next) {
//     console.log('This is the second middleware: Will save document!');
//     next();
// });

// // pre middleware: run after all pre middleware has finished
// tourSchema.post('save', function(doc, next) {
//     console.log(doc);
//     next();
// });

// QUERY MIDDLEWARE: be executed just before/after executing query
tourSchema.pre(/^find/, function(next) {
    // all the string start with 'find'
    this.find({ secretTour: { $ne: true } }); // 'this' now point to query object

    this.start = Date.now();
    next();
});

// Populate: reference a property to the right doccument(for example: an id to get the entire doccument represented by the id) in the model, get acctually data in the query.
tourSchema.pre(/^find/, function(next) {
    // 'this' now point to query object
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    });
    next();
});

tourSchema.post(/^find/, function(docs, next) {
    // all the string start with 'find'
    //console.log(docs); // 'this' now point to query object
    console.log(`Query took ${Date.now() - this.start} ms`);
    next();
});

// AGGREAGATE MIDDLEWARE: executed before/after aggreate is executed
// tourSchema.pre('aggregate', function(next) {
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//     console.log(this.pipeline());
//     next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
