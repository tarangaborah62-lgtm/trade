const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'clothing',
      'electronics',
      'grocery',
      'furniture',
      'beauty',
      'sports',
      'automotive',
      'books',
      'toys',
      'health',
      'home',
      'other'
    ]
  },
  moq: {
    type: Number,
    required: [true, 'Minimum Order Quantity is required'],
    min: [1, 'MOQ must be at least 1'],
    default: 1
  },
  discountTiers: [{
    minQty: {
      type: Number,
      required: true,
      min: 1
    },
    discountPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  }],
  images: [{
    type: String
  }],
  stock: {
    type: Number,
    required: [true, 'Stock is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  unit: {
    type: String,
    default: 'piece',
    enum: ['piece', 'kg', 'dozen', 'box', 'carton', 'set']
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for search and filtering
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ supplierId: 1 });
productSchema.index({ price: 1 });

module.exports = mongoose.model('Product', productSchema);
