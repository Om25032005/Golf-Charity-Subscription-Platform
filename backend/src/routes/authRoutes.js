const express = require('express');
const router = express.Router();
const { signup, login, getMe, logout, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { signupValidation, loginValidation } = require('../validators');

router.post('/signup', ...signupValidation, validate, signup);
router.post('/login', ...loginValidation, validate, login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.patch('/change-password', protect, changePassword);

module.exports = router;
