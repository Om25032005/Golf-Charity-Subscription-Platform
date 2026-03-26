const getStripe = require('../config/stripe');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const PLAN_PRICE_MAP = {
    monthly: process.env.STRIPE_MONTHLY_PRICE_ID,
    yearly: process.env.STRIPE_YEARLY_PRICE_ID,
};

// ─── POST /api/subscriptions/checkout ───────────────────────────────────────
// Creates a Stripe Checkout session and returns the URL
const createCheckoutSession = asyncHandler(async (req, res, next) => {
    const { plan } = req.body;
    if (!['monthly', 'yearly'].includes(plan)) {
        return next(new AppError('Plan must be "monthly" or "yearly".', 400));
    }

    const user = await User.findById(req.user._id);

    // Create or retrieve Stripe Customer
    let customerId = user.subscription.stripeCustomerId;
    if (!customerId) {
        const customer = await getStripe().customers.create({
            email: user.email,
            name: user.name,
            metadata: { userId: user._id.toString() },
        });
        customerId = customer.id;
        user.subscription.stripeCustomerId = customerId;
        await user.save({ validateBeforeSave: false });
    }

    const session = await getStripe().checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: PLAN_PRICE_MAP[plan], quantity: 1 }],
        mode: 'subscription',
        success_url: `${process.env.CLIENT_URL}/dashboard?subscription=success`,
        cancel_url: `${process.env.CLIENT_URL}/dashboard?subscription=cancelled`,
        metadata: { userId: user._id.toString(), plan },
    });

    res.status(200).json({
        success: true,
        data: { checkoutUrl: session.url, sessionId: session.id },
    });
});

// ─── POST /api/subscriptions/portal ─────────────────────────────────────────
// Returns a Stripe Customer Portal URL (manage/cancel subscription)
const createPortalSession = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user._id);
    if (!user.subscription.stripeCustomerId) {
        return next(new AppError('No billing account found. Please subscribe first.', 400));
    }

    const session = await getStripe().billingPortal.sessions.create({
        customer: user.subscription.stripeCustomerId,
        return_url: `${process.env.CLIENT_URL}/dashboard`,
    });

    res.status(200).json({ success: true, data: { portalUrl: session.url } });
});

// ─── GET /api/subscriptions/status ──────────────────────────────────────────
const getSubscriptionStatus = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('subscription name email');
    res.status(200).json({ success: true, data: { subscription: user.subscription } });
});

// ─── POST /api/subscriptions/webhook ─────────────────────────────────────────
// Stripe webhook handler — must use raw body (configured in app.js)
const handleWebhook = asyncHandler(async (req, res, next) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
        // Skip verification if secret is placeholder or missing (dev mode)
        if (!secret || secret.startsWith('whsec_your_')) {
            console.warn('⚠️ Stripe webhook signature verification skipped (Dev Mode).');
            // If express.raw() was used, req.body is a Buffer
            event = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString()) : req.body;
        } else {
            event = getStripe().webhooks.constructEvent(
                req.body,
                sig,
                secret
            );
        }
    } catch (err) {
        console.error('Webhook Error:', err.message);
        return next(new AppError(`Webhook Error: ${err.message}`, 400));
    }

    const session = event.data.object;

    switch (event.type) {
        case 'checkout.session.completed': {
            // Provision subscription
            const userId = session.metadata.userId;
            const subscriptionId = session.subscription;
            const stripeSub = await getStripe().subscriptions.retrieve(subscriptionId);

            await User.findByIdAndUpdate(userId, {
                'subscription.stripeSubscriptionId': subscriptionId,
                'subscription.plan': session.metadata.plan,
                'subscription.status': 'active',
                'subscription.currentPeriodEnd': new Date(stripeSub.current_period_end * 1000),
            });
            break;
        }

        case 'customer.subscription.updated': {
            const userId = (await User.findOne({ 'subscription.stripeSubscriptionId': session.id }))?._id;
            if (userId) {
                await User.findByIdAndUpdate(userId, {
                    'subscription.status': session.status,
                    'subscription.currentPeriodEnd': new Date(session.current_period_end * 1000),
                });
            }
            break;
        }

        case 'customer.subscription.deleted': {
            await User.findOneAndUpdate(
                { 'subscription.stripeSubscriptionId': session.id },
                {
                    'subscription.status': 'cancelled',
                    'subscription.stripeSubscriptionId': null,
                }
            );
            break;
        }

        case 'invoice.payment_failed': {
            await User.findOneAndUpdate(
                { 'subscription.stripeCustomerId': session.customer },
                { 'subscription.status': 'past_due' }
            );
            break;
        }

        default:
            console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
});

/**
 * Force sync subscription status from Stripe (fallback for missing webhooks)
 */
const syncSubscription = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user._id);
    if (!user.subscription.stripeCustomerId) {
        return res.status(200).json({ success: true, message: 'No Stripe customer linked yet.', data: { subscription: user.subscription } });
    }

    // Fetch active/trialing subscriptions for this customer
    const subs = await getStripe().subscriptions.list({
        customer: user.subscription.stripeCustomerId,
        status: 'all',
        limit: 1,
    });

    if (subs.data.length === 0) {
        // No subscriptions found, set to inactive if it was active
        if (user.subscription.status !== 'inactive') {
            user.subscription.status = 'inactive';
            user.subscription.stripeSubscriptionId = null;
            await user.save({ validateBeforeSave: false });
        }
    } else {
        const stripeSub = subs.data[0];
        // Find which plan this corresponds to
        const priceId = stripeSub.items.data[0].price.id;
        const plan = priceId === process.env.STRIPE_YEARLY_PRICE_ID ? 'yearly' : 'monthly';

        user.subscription.stripeSubscriptionId = stripeSub.id;
        user.subscription.status = stripeSub.status;
        user.subscription.plan = plan;
        user.subscription.currentPeriodEnd = new Date(stripeSub.current_period_end * 1000);
        
        // Ensure user is active if they have an active sub
        if (['active', 'trialing'].includes(stripeSub.status)) {
            user.isActive = true;
        }
        
        await user.save({ validateBeforeSave: false });
    }

    res.status(200).json({
        success: true,
        message: 'Subscription synced successfully.',
        data: { subscription: user.subscription },
    });
});

module.exports = {
    createCheckoutSession,
    createPortalSession,
    getSubscriptionStatus,
    handleWebhook,
    syncSubscription,
};
