const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const validate = require('../middleware/validate');
const { createComplaint, getComplaints, resolveComplaint, createComplaintValidation } = require('../controllers/complaintController');

router.post('/', auth, authorize('buyer'), createComplaintValidation, validate, createComplaint);
router.get('/', auth, getComplaints);
router.put('/:id', auth, authorize('admin'), resolveComplaint);

module.exports = router;
