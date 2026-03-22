const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { register, login, getMe, updateProfile, registerValidation, loginValidation } = require('../controllers/authController');

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.get('/me', auth, getMe);
router.put('/profile', auth, updateProfile);

module.exports = router;
