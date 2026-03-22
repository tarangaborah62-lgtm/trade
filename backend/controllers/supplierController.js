const Order = require('../models/Order');
const Product = require('../models/Product');
const Review = require('../models/Review');
const { AppError } = require('../utils/errorHandler');

// @route   GET /api/supplier/dashboard
const getSupplierDashboard = async (req, res, next) => {
  try {
    const supplierId = req.user._id;

    const [totalProducts, activeProducts, totalOrders, pendingOrders] = await Promise.all([
      Product.countDocuments({ supplierId }),
      Product.countDocuments({ supplierId, active: true }),
      Order.countDocuments({ supplierId }),
      Order.countDocuments({ supplierId, status: 'pending' })
    ]);

    // Earnings
    const earningsStats = await Order.aggregate([
      { $match: { supplierId: supplierId, status: { $in: ['confirmed', 'shipped', 'delivered'] } } },
      { $group: { _id: null, totalEarnings: { $sum: '$supplierAmount' }, totalOrders: { $sum: 1 } } }
    ]);

    const earnings = earningsStats[0] || { totalEarnings: 0, totalOrders: 0 };

    // Recent orders
    const recentOrders = await Order.find({ supplierId })
      .populate('buyerId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent reviews
    const recentReviews = await Review.find({ supplierId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats: {
        totalProducts,
        activeProducts,
        totalOrders,
        pendingOrders,
        totalEarnings: earnings.totalEarnings,
        rating: req.user.rating,
        totalReviews: req.user.totalReviews,
        verified: req.user.verified
      },
      recentOrders,
      recentReviews
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/supplier/profile/:id
const getSupplierProfile = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const supplier = await User.findOne({ _id: req.params.id, role: 'supplier' })
      .select('name businessName businessDescription location phone whatsapp rating totalReviews totalOrders verified avatar createdAt');

    if (!supplier) throw new AppError('Supplier not found', 404);

    const products = await Product.find({ supplierId: supplier._id, active: true })
      .sort({ createdAt: -1 })
      .limit(8);

    const reviews = await Review.find({ supplierId: supplier._id })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({ supplier, products, reviews });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSupplierDashboard, getSupplierProfile };
