const express = require('express');
const router = express.Router();
const {
    createCheckoutSession,
    createPortalSession,
    getSubscriptionStatus,
    syncSubscription,
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');

// All subscription routes require authentication
router.use(protect);

router.get('/status', getSubscriptionStatus);
router.post('/checkout', createCheckoutSession);
router.post('/portal', createPortalSession);
router.post('/sync', syncSubscription);

module.exports = router;
