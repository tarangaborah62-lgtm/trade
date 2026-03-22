const { body } = require('express-validator');
const Product = require('../models/Product');
const { AppError } = require('../utils/errorHandler');

// @route   GET /api/products
const getProducts = async (req, res, next) => {
  try {
    const { category, search, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;
    const query = { active: true };

    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    let sortObj = { createdAt: -1 };
    if (sort === 'price_asc') sortObj = { price: 1 };
    if (sort === 'price_desc') sortObj = { price: -1 };
    if (sort === 'newest') sortObj = { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('supplierId', 'businessName rating verified location')
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit));

    res.json({
      products,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/products/:id
const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('supplierId', 'businessName businessDescription rating verified location phone whatsapp totalReviews totalOrders');
    
    if (!product) throw new AppError('Product not found', 404);
    res.json({ product });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/products  (supplier only)
const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, moq, discountTiers, stock, unit } = req.body;

    const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

    let parsedTiers = [];
    if (discountTiers) {
      parsedTiers = typeof discountTiers === 'string' ? JSON.parse(discountTiers) : discountTiers;
    }

    const product = await Product.create({
      name,
      description,
      price: Number(price),
      supplierId: req.user._id,
      category,
      moq: Number(moq) || 1,
      discountTiers: parsedTiers,
      images,
      stock: Number(stock) || 0,
      unit: unit || 'piece'
    });

    res.status(201).json({ message: 'Product created', product });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/products/:id  (supplier only)
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) throw new AppError('Product not found', 404);
    if (product.supplierId.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to update this product', 403);
    }

    const { name, description, price, category, moq, discountTiers, stock, unit, active } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = Number(price);
    if (category !== undefined) updates.category = category;
    if (moq !== undefined) updates.moq = Number(moq);
    if (stock !== undefined) updates.stock = Number(stock);
    if (unit !== undefined) updates.unit = unit;
    if (active !== undefined) updates.active = active;
    if (discountTiers !== undefined) {
      updates.discountTiers = typeof discountTiers === 'string' ? JSON.parse(discountTiers) : discountTiers;
    }

    // Append new images if uploaded
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(f => `/uploads/${f.filename}`);
      updates.images = [...(product.images || []), ...newImages];
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json({ message: 'Product updated', product: updated });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/products/:id  (supplier only)
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) throw new AppError('Product not found', 404);
    if (product.supplierId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new AppError('Not authorized to delete this product', 403);
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/products/supplier/my-products  (supplier only)
const getMyProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments({ supplierId: req.user._id });
    const products = await Product.find({ supplierId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      products,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    next(error);
  }
};

const createProductValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').notEmpty().withMessage('Category is required'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be non-negative'),
  body('moq').optional().isInt({ min: 1 }).withMessage('MOQ must be at least 1')
];

module.exports = {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  getMyProducts, createProductValidation
};
