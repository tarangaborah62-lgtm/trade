const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  getMyProducts, createProductValidation
} = require('../controllers/productController');

// Public routes
router.get('/', getProducts);
router.get('/supplier/my-products', auth, authorize('supplier'), getMyProducts);
router.get('/:id', getProduct);

// Supplier-only routes
router.post('/', auth, authorize('supplier'), upload.array('images', 5), createProductValidation, validate, createProduct);
router.put('/:id', auth, authorize('supplier'), upload.array('images', 5), updateProduct);
router.delete('/:id', auth, authorize('supplier', 'admin'), deleteProduct);

module.exports = router;
