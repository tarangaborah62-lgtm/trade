const { body } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { applyDiscount } = require('../services/discount');
const { calculateCommission } = require('../services/commission');
const { AppError } = require('../utils/errorHandler');

// @route   POST /api/orders  (buyer only)
const createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, notes } = req.body;
    // items = [{ productId, quantity }]

    if (!items || items.length === 0) {
      throw new AppError('Order must have at least one item', 400);
    }

    // All items must belong to the same supplier
    const productIds = items.map(i => i.productId);
    const products = await Product.find({ _id: { $in: productIds }, active: true });

    if (products.length !== items.length) {
      throw new AppError('One or more products not found or inactive', 400);
    }

    const supplierIds = [...new Set(products.map(p => p.supplierId.toString()))];
    if (supplierIds.length > 1) {
      throw new AppError('All items in an order must be from the same supplier', 400);
    }

    const supplierId = products[0].supplierId;

    // Prevent buyer from ordering from themselves
    if (supplierId.toString() === req.user._id.toString()) {
      throw new AppError('You cannot order your own products', 400);
    }

    // Validate quantities and MOQ, calculate totals
    let totalAmount = 0;
    let totalDiscount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = products.find(p => p._id.toString() === item.productId);
      
      if (item.quantity < product.moq) {
        throw new AppError(`Minimum order quantity for "${product.name}" is ${product.moq}`, 400);
      }

      if (item.quantity > product.stock) {
        throw new AppError(`Insufficient stock for "${product.name}". Available: ${product.stock}`, 400);
      }

      const { subtotal, discount, finalPrice } = applyDiscount(product.price, item.quantity, product.discountTiers);
      
      totalAmount += subtotal;
      totalDiscount += discount;

      orderItems.push({
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal: finalPrice
      });
    }

    const afterDiscount = totalAmount - totalDiscount;
    const { commission, supplierAmount, commissionRate } = calculateCommission(afterDiscount);

    const order = await Order.create({
      buyerId: req.user._id,
      supplierId,
      items: orderItems,
      totalAmount,
      discount: totalDiscount,
      commission,
      commissionRate,
      finalAmount: afterDiscount,
      supplierAmount,
      status: 'pending',
      shippingAddress,
      notes
    });

    // Deduct stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
    }

    // Update order counts
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalOrders: 1 } });
    await User.findByIdAndUpdate(supplierId, { $inc: { totalOrders: 1 } });

    // Notify supplier
    await Notification.create({
      userId: supplierId,
      message: `New order #${order._id.toString().slice(-6)} received from ${req.user.name}`,
      type: 'order',
      relatedId: order._id
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('buyerId', 'name phone email')
      .populate('supplierId', 'businessName phone');

    res.status(201).json({ message: 'Order placed successfully', order: populatedOrder });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/orders
const getOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (req.user.role === 'buyer') query.buyerId = req.user._id;
    else if (req.user.role === 'supplier') query.supplierId = req.user._id;
    // admin sees all

    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('buyerId', 'name phone email')
      .populate('supplierId', 'businessName phone')
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

// @route   GET /api/orders/:id
const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('buyerId', 'name phone email')
      .populate('supplierId', 'businessName phone whatsapp location')
      .populate('items.productId', 'name images');

    if (!order) throw new AppError('Order not found', 404);

    // Authorization check
    if (req.user.role === 'buyer' && order.buyerId._id.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized', 403);
    }
    if (req.user.role === 'supplier' && order.supplierId._id.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized', 403);
    }

    res.json({ order });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/orders/:id/status  (supplier/admin)
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['shipped', 'cancelled'],
      shipped: ['delivered', 'returned'],
      delivered: ['returned'],
      returned: [],
      cancelled: []
    };

    const order = await Order.findById(req.params.id);
    if (!order) throw new AppError('Order not found', 404);

    // Authorization
    if (req.user.role === 'supplier' && order.supplierId.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized', 403);
    }

    if (!validTransitions[order.status]?.includes(status)) {
      throw new AppError(`Cannot transition from "${order.status}" to "${status}"`, 400);
    }

    order.status = status;
    await order.save();

    // Restore stock on cancellation or return
    if (status === 'cancelled' || status === 'returned') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
      }
    }

    // Notify buyer
    await Notification.create({
      userId: order.buyerId,
      message: `Order #${order._id.toString().slice(-6)} status updated to ${status}`,
      type: 'order',
      relatedId: order._id
    });

    res.json({ message: 'Order status updated', order });
  } catch (error) {
    next(error);
  }
};

const createOrderValidation = [
  body('items').isArray({ min: 1 }).withMessage('Items are required'),
  body('items.*.productId').notEmpty().withMessage('Product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
];

module.exports = { createOrder, getOrders, getOrder, updateOrderStatus, createOrderValidation };
