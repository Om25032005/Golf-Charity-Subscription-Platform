import { useState, useEffect } from 'react';
import { subscriptionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { CreditCard, CheckCircle, XCircle, ExternalLink, Zap } from 'lucide-react';

const PLANS = [
  {
    key: 'monthly',
    label: 'Monthly',
    price: '£9.99',
    period: '/month',
    features: ['Enter monthly draw', '5 score slots', 'Charity contribution'],
  },
  {
    key: 'yearly',
    label: 'Yearly',
    price: '£99.99',
    period: '/year',
    badge: '2 months free',
    features: ['Enter monthly draw', '5 score slots', 'Charity contribution', 'Priority support'],
  },
];

export default function SubscriptionCard() {
  const { user, updateUser } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState('');
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    subscriptionAPI.getStatus()
      .then(({ data }) => setStatus(data.data.subscription))
      .catch(() => toast.error('Failed to load subscription'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (plan) => {
    setCheckoutLoading(plan);
    try {
      const { data } = await subscriptionAPI.createCheckout(plan);
      window.location.href = data.data.checkoutUrl;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start checkout');
    } finally {
      setCheckoutLoading('');
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const { data } = await subscriptionAPI.createPortal();
      window.location.href = data.data.portalUrl;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not open billing portal');
    } finally {
      setPortalLoading(false);
    }
  };

  const isActive = status?.status === 'active' || status?.status === 'trialing';

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-5 bg-gray-700 rounded w-1/3 mb-4" />
        <div className="h-24 bg-gray-800 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
          <CreditCard className="w-4 h-4 text-blue-400" />
        </div>
        <h2 className="font-semibold text-white">Subscription</h2>
      </div>

      {isActive ? (
        /* ── Active Subscription ── */
        <div>
          <div className="bg-green-900/20 border border-green-700/40 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="font-semibold text-green-300">Active Subscription</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <p className="text-xs text-gray-500">Plan</p>
                <p className="text-sm font-medium text-white capitalize">{status.plan}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Renews</p>
                <p className="text-sm font-medium text-white">
                  {status.currentPeriodEnd
                    ? new Date(status.currentPeriodEnd).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })
                    : '—'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handlePortal}
            disabled={portalLoading}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            {portalLoading ? 'Opening...' : 'Manage / Cancel Subscription'}
          </button>
        </div>
      ) : (
        /* ── Choose a Plan ── */
        <div>
          {status?.status === 'past_due' && (
            <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/40 rounded-lg p-3 mb-4">
              <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-300">
                Your last payment failed. Please update your payment method.
              </p>
            </div>
          )}

          <p className="text-sm text-gray-400 mb-4">
            Choose a plan to enter the monthly draw and support your charity.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {PLANS.map((plan) => (
              <div
                key={plan.key}
                className="relative bg-gray-800 border border-gray-700 hover:border-green-600 rounded-xl p-4 transition-colors"
              >
                {plan.badge && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {plan.badge}
                  </span>
                )}
                <p className="font-semibold text-white">{plan.label}</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {plan.price}
                  <span className="text-sm font-normal text-gray-400">{plan.period}</span>
                </p>
                <ul className="mt-3 space-y-1.5 mb-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-gray-300">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe(plan.key)}
                  disabled={!!checkoutLoading}
                  className="btn-primary w-full flex items-center justify-center gap-1.5 text-sm py-2"
                >
                  <Zap className="w-3.5 h-3.5" />
                  {checkoutLoading === plan.key ? 'Redirecting...' : 'Subscribe'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
