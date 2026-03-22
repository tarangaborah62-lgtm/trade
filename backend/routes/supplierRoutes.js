const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const { getSupplierDashboard, getSupplierProfile } = require('../controllers/supplierController');

router.get('/dashboard', auth, authorize('supplier'), getSupplierDashboard);
router.get('/profile/:id', getSupplierProfile);

module.exports = router;
