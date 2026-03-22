const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const validate = require('../middleware/validate');
const { createOrder, getOrders, getOrder, updateOrderStatus, createOrderValidation } = require('../controllers/orderController');

router.post('/', auth, authorize('buyer'), createOrderValidation, validate, createOrder);
router.get('/', auth, getOrders);
router.get('/:id', auth, getOrder);
router.put('/:id/status', auth, authorize('supplier', 'admin'), updateOrderStatus);

module.exports = router;
