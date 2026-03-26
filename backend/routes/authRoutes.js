const express = require('express');
const { register, login } = require('../controllers/authController');
const router = express.Router();

// ========== register endpoint ==========
router.post('/register', register);

// ========== login endpoint ==========
router.post('/login', login);

module.exports = router;
