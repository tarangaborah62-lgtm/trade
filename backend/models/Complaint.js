const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: [true, 'Complaint reason is required'],
    trim: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: ['quality', 'delivery', 'wrong_item', 'damaged', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['open', 'investigating', 'resolved', 'refunded', 'rejected'],
    default: 'open'
  },
  refundStatus: {
    type: String,
    enum: ['none', 'pending', 'completed'],
    default: 'none'
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: 1000
  }
}, {
  timestamps: true
});

complaintSchema.index({ userId: 1, createdAt: -1 });
complaintSchema.index({ supplierId: 1 });
complaintSchema.index({ status: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
