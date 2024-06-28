const catchAsync = require('../ultils/catchAsync');
const AppError = require('../ultils/appError');
const APIFeatures = require('../ultils/apiFeatures');

exports.deleteOne = Model =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndDelete(req.params.id);

        if (!doc) {
            return next(new AppError('No document found with the ID', 404));
        }

        res.status(204).json({
            // 204: no content
            status: 'success',
            data: null
        });
    });

exports.updateOne = Model =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // make await new updated result possible
            runValidators: true // run validators created in model
        });

        if (!doc) {
            return next(new AppError('No document found with the ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                data: doc
            }
        });
    });

exports.createOne = Model =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.create(req.body);
        res.status(201).json({
            // 201: created
            status: 'success',
            data: {
                data: doc
            }
        });
    });

exports.getOne = (Model, popOptions) =>
    catchAsync(async (req, res, next) => {
        let query = Model.findById(req.params.id);
        if (popOptions) query = query.populate(popOptions);
        const doc = await query;

        // Tour.findOne({_id: req.params.id}) in mongo shell

        if (!doc) {
            return next(new AppError('No document found with the ID', 404));
        }

        res.status(200).json({
            // 200: ok
            status: 'success',
            data: {
                data: doc
            }
        });
    });

exports.getAll = Model =>
    catchAsync(async (req, res, next) => {
        // To allow nested GET reviews on tour
        let filter;
        if (req.params.tourId) filter = { tour: req.params.tourId };

        // EXECUTE THE QUERY
        const features = new APIFeatures(Model.find(filter), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();
        // const docs = await features.query.explain();
        const docs = await features.query;

        // SEND RESPONSE
        res.status(200).json({
            // 200: ok
            status: 'success',
            results: docs.length,
            data: {
                docs
            }
        });
    });
