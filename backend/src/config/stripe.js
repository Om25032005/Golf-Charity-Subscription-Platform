let _stripe = null;

/**
 * Returns the Stripe instance, initializing it lazily.
 * This prevents Stripe from throwing at module load time
 * when STRIPE_SECRET_KEY is not yet set (e.g., during tests or cold require).
 */
const getStripe = () => {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('sk_test_your')) {
      throw new Error('STRIPE_SECRET_KEY is not configured. Please set a valid Stripe secret key in .env');
    }
    const Stripe = require('stripe');
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      timeout: 20000,
    });
  }
  return _stripe;
};

module.exports = getStripe;
