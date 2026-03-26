const express = require('express');
const router = express.Router();
const { getMyScores, submitScore, deleteScore, updateScore } = require('../controllers/scoreController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { scoreValidation } = require('../validators');

// All score routes require authentication
router.use(protect);

router.get('/my', getMyScores);
router.post('/', ...scoreValidation, validate, submitScore);
router.put('/:scoreId', ...scoreValidation, validate, updateScore);
router.delete('/:scoreId', deleteScore);

module.exports = router;
