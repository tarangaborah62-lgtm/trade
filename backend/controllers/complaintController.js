const { body } = require('express-validator');
const Complaint = require('../models/Complaint');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const { recalculateRating } = require('../services/rating');
const { AppError } = require('../utils/errorHandler');

// @route   POST /api/complaints  (buyer only)
const createComplaint = async (req, res, next) => {
  try {
    const { orderId, reason, type } = req.body;

    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Order not found', 404);
    if (order.buyerId.toString() !== req.user._id.toString()) {
      throw new AppError('You can only raise complaints for your own orders', 403);
    }

    // Check for duplicate complaint on same order
    const existing = await Complaint.findOne({ orderId, userId: req.user._id, status: { $in: ['open', 'investigating'] } });
    if (existing) throw new AppError('You already have an active complaint for this order', 400);

    const complaint = await Complaint.create({
      orderId,
      userId: req.user._id,
      supplierId: order.supplierId,
      reason,
      type: type || 'other'
    });

    // Recalculate supplier rating (complaint penalty)
    await recalculateRating(order.supplierId);

    // Notify supplier
    await Notification.create({
      userId: order.supplierId,
      message: `A complaint has been raised for order #${orderId.toString().slice(-6)}`,
      type: 'complaint',
      relatedId: complaint._id
    });

    res.status(201).json({ message: 'Complaint submitted', complaint });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/complaints
const getComplaints = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (req.user.role === 'buyer') query.userId = req.user._id;
    else if (req.user.role === 'supplier') query.supplierId = req.user._id;
    // admin sees all

    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Complaint.countDocuments(query);
    const complaints = await Complaint.find(query)
      .populate('userId', 'name email')
      .populate('supplierId', 'businessName')
      .populate('orderId', 'totalAmount status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      complaints,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/complaints/:id  (admin only)
const resolveComplaint = async (req, res, next) => {
  try {
    const { status, refundStatus, adminNotes } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) throw new AppError('Complaint not found', 404);

    if (status) complaint.status = status;
    if (refundStatus) complaint.refundStatus = refundStatus;
    if (adminNotes) complaint.adminNotes = adminNotes;

    await complaint.save();

    // If refunded, update order status
    if (refundStatus === 'completed') {
      await Order.findByIdAndUpdate(complaint.orderId, { status: 'returned' });
    }

    // Recalculate rating after resolution
    await recalculateRating(complaint.supplierId);

    // Notify buyer
    await Notification.create({
      userId: complaint.userId,
      message: `Your complaint has been updated to "${status}"`,
      type: 'complaint',
      relatedId: complaint._id
    });

    res.json({ message: 'Complaint updated', complaint });
  } catch (error) {
    next(error);
  }
};

const createComplaintValidation = [
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('reason').trim().notEmpty().isLength({ max: 2000 }).withMessage('Reason is required (max 2000 chars)'),
  body('type').optional().isIn(['quality', 'delivery', 'wrong_item', 'damaged', 'other'])
];

module.exports = { createComplaint, getComplaints, resolveComplaint, createComplaintValidation };
