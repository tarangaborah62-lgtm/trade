const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const { AppError } = require('../utils/errorHandler');

// @route   GET /api/admin/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const [totalUsers, totalSuppliers, totalBuyers, totalProducts, totalOrders, totalComplaints] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'supplier' }),
      User.countDocuments({ role: 'buyer' }),
      Product.countDocuments(),
      Order.countDocuments(),
      Complaint.countDocuments({ status: 'open' })
    ]);

    // Revenue stats
    const revenueStats = await Order.aggregate([
      { $match: { status: { $in: ['confirmed', 'shipped', 'delivered'] } } },
      { $group: { _id: null, totalRevenue: { $sum: '$finalAmount' }, totalCommission: { $sum: '$commission' } } }
    ]);

    const revenue = revenueStats[0] || { totalRevenue: 0, totalCommission: 0 };

    // Recent orders
    const recentOrders = await Order.find()
      .populate('buyerId', 'name')
      .populate('supplierId', 'businessName')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats: {
        totalUsers, totalSuppliers, totalBuyers, totalProducts,
        totalOrders, openComplaints: totalComplaints,
        totalRevenue: revenue.totalRevenue,
        totalCommission: revenue.totalCommission
      },
      recentOrders
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/admin/users
const getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      users,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/admin/users/:id/verify
const verifySupplier = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError('User not found', 404);
    if (user.role !== 'supplier') throw new AppError('Can only verify suppliers', 400);

    user.verified = !user.verified;
    await user.save();

    await Notification.create({
      userId: user._id,
      message: user.verified ? 'Your supplier account has been verified!' : 'Your supplier verification has been revoked.',
      type: 'verification'
    });

    res.json({ message: `Supplier ${user.verified ? 'verified' : 'unverified'}`, user });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/admin/orders
const getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('buyerId', 'name email')
      .populate('supplierId', 'businessName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      orders,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard, getUsers, verifySupplier, getAllOrders };
