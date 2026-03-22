const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const validate = require('../middleware/validate');
const { createReview, getSupplierReviews, createReviewValidation } = require('../controllers/reviewController');

router.post('/', auth, authorize('buyer'), createReviewValidation, validate, createReview);
router.get('/supplier/:supplierId', getSupplierReviews);

module.exports = router;
