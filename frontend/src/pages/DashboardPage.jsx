import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscriptionAPI } from '../services/api';
import Navbar from '../components/Navbar';
import ScoreManager from '../components/ScoreManager';
import SubscriptionCard from '../components/SubscriptionCard';
import DrawResults from '../components/DrawResults';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const isSuccess = params.get('subscription') === 'success';

    if (isSuccess) {
      let attempts = 0;
      const MAX_ATTEMPTS = 5;
      let timeoutId = null;

      const syncAndCheck = async () => {
        try {
          const { data } = await subscriptionAPI.sync();
          await refreshUser();

          if (['active', 'trialing'].includes(data.data.subscription.status)) {
            toast.success('Subscription activated!');
            navigate('/dashboard', { replace: true });
          } else if (attempts < MAX_ATTEMPTS) {
            attempts++;
            timeoutId = setTimeout(syncAndCheck, 2000);
          } else {
            toast.error('Activation taking too long. Please refresh later.');
            navigate('/dashboard', { replace: true });
          }
        } catch (err) {
          console.error('Subscription sync failed', err);
          if (attempts < MAX_ATTEMPTS) {
            attempts++;
            timeoutId = setTimeout(syncAndCheck, 2000);
          }
        }
      };

      timeoutId = setTimeout(syncAndCheck, 1500);
      return () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
    }
  }, [location.search, refreshUser, navigate]);

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome back, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Manage your scores, subscription, and charity contributions.
            </p>
          </div>
          {user?.charity && (
            <div className="hidden sm:flex items-center gap-2 bg-green-900/20 border border-green-700/30 rounded-xl px-4 py-2">
              <Heart className="w-4 h-4 text-green-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Supporting</p>
                <p className="text-sm font-semibold text-green-300">{user.charity.name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            {
              label: 'Scores',
              value: `${user?.scores?.length || 0}/5`,
              color: 'text-green-400',
            },
            {
              label: 'Plan',
              value: user?.subscription?.plan
                ? user.subscription.plan.charAt(0).toUpperCase() + user.subscription.plan.slice(1)
                : 'None',
              color: 'text-blue-400',
            },
            {
              label: 'Status',
              value:
                ['active', 'trialing'].includes(user?.subscription?.status) ? 'Active' :
                user?.subscription?.status === 'past_due' ? 'Past Due' :
                'Inactive',
              color:
                ['active', 'trialing'].includes(user?.subscription?.status) ? 'text-green-400' :
                user?.subscription?.status === 'past_due' ? 'text-red-400' :
                'text-gray-400',
            },
            {
              label: 'Charity',
              value: user?.charity?.name?.split(' ').slice(0, 2).join(' ') || '—',
              color: 'text-pink-400',
            },
          ].map((stat) => (
            <div key={stat.label} className="card py-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</p>
              <p className={`text-lg font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            <ScoreManager />
            <SubscriptionCard />
          </div>
          {/* Right column */}
          <div>
            <DrawResults />
          </div>
        </div>
      </main>
    </div>
  );
}
