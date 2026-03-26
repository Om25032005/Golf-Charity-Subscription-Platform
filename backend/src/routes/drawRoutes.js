const express = require('express');
const router = express.Router();
const { getDrawHistory, getLatestDraw, getMyDrawResults } = require('../controllers/drawController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getDrawHistory);
router.get('/latest', getLatestDraw);
router.get('/my-results', getMyDrawResults);

module.exports = router;
