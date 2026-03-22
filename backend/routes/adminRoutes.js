const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const { getDashboard, getUsers, verifySupplier, getAllOrders } = require('../controllers/adminController');
const { getComplaints, resolveComplaint } = require('../controllers/complaintController');

// All admin routes require auth + admin role
router.use(auth, authorize('admin'));

router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.put('/users/:id/verify', verifySupplier);
router.get('/orders', getAllOrders);
router.get('/complaints', getComplaints);
router.put('/complaints/:id', resolveComplaint);

module.exports = router;
