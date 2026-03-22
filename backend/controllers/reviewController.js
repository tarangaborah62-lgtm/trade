const { body } = require('express-validator');
const Review = require('../models/Review');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const { recalculateRating } = require('../services/rating');
const { AppError } = require('../utils/errorHandler');

// @route   POST /api/reviews  (buyer only)
const createReview = async (req, res, next) => {
  try {
    const { orderId, rating, comment } = req.body;

    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Order not found', 404);
    if (order.buyerId.toString() !== req.user._id.toString()) {
      throw new AppError('You can only review your own orders', 403);
    }
    if (order.status !== 'delivered') {
      throw new AppError('You can only review delivered orders', 400);
    }

    // Check for existing review
    const existing = await Review.findOne({ userId: req.user._id, orderId });
    if (existing) throw new AppError('You have already reviewed this order', 400);

    const review = await Review.create({
      userId: req.user._id,
      supplierId: order.supplierId,
      orderId,
      rating,
      comment
    });

    // Recalculate supplier rating
    await recalculateRating(order.supplierId);

    // Notify supplier
    await Notification.create({
      userId: order.supplierId,
      message: `You received a ${rating}-star review from ${req.user.name}`,
      type: 'review',
      relatedId: review._id
    });

    res.status(201).json({ message: 'Review submitted', review });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/reviews/supplier/:supplierId
const getSupplierReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Review.countDocuments({ supplierId: req.params.supplierId });
    const reviews = await Review.find({ supplierId: req.params.supplierId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      reviews,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    next(error);
  }
};

const createReviewValidation = [
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 1000 })
];

module.exports = { createReview, getSupplierReviews, createReviewValidation };
