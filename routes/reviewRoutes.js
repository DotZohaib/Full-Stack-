const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true }); // allow access to param of parent route

// POST tours/tourId/reviews/
// GET tours/tourId/reviews/
// POST reviews/
router.use(authController.protect);

router
    .route('/')
    .post(
        authController.restrictTo('user'),
        reviewController.setTourAndUserId,
        reviewController.createReview
    ) // Need somemore middleware
    .get(reviewController.getAllReviews);

router
    .route('/:id')
    .patch(
        authController.restrictTo('user', 'admin'),
        reviewController.updateReview
    )
    .delete(
        authController.restrictTo('user', 'admin'),
        reviewController.deleteReview
    )
    .get(reviewController.getReview);

module.exports = router;
