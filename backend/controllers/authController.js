const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/User');
const { AppError } = require('../utils/errorHandler');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

// @route   POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, businessName, businessDescription, location, whatsapp } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('An account with this email already exists', 400);
    }

    const userData = { name, email, phone, password, role: role || 'buyer' };
    
    // Add supplier-specific fields
    if (role === 'supplier') {
      userData.businessName = businessName;
      userData.businessDescription = businessDescription;
      userData.location = location;
      userData.whatsapp = whatsapp;
    }

    const user = await User.create(userData);
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'phone', 'businessName', 'businessDescription', 'location', 'whatsapp'];
    const updates = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ message: 'Profile updated', user });
  } catch (error) {
    next(error);
  }
};

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['buyer', 'supplier']).withMessage('Role must be buyer or supplier')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

module.exports = { register, login, getMe, updateProfile, registerValidation, loginValidation };
