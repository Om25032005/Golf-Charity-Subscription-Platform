const express = require('express');
const router = express.Router();
const { getAllCharities, getCharity } = require('../controllers/charityController');

// Public routes — anyone can view charities for the signup form
router.get('/', getAllCharities);
router.get('/:id', getCharity);

module.exports = router;
