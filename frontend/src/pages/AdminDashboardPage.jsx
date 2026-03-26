import { useState, useEffect, useCallback } from 'react';
import { adminAPI, charityAPI } from '../services/api';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import {
  Users, Heart, Dices, Award, CheckCircle, XCircle,
  Shield, RefreshCw, ChevronDown, ChevronUp, BarChart3,
} from 'lucide-react';

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'charities', label: 'Charities', icon: Heart },
  { key: 'draw', label: 'Run Draw', icon: Dices },
  { key: 'winners', label: 'Verify Winners', icon: Award },
];

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getStats()
      .then(({ data }) => setStats(data.data))
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="card h-20 animate-pulse" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats?.stats.totalUsers} icon={Users} color="bg-blue-600" />
        <StatCard label="Active Subscribers" value={stats?.stats.activeSubscribers} icon={Shield} color="bg-green-600" />
        <StatCard label="Total Draws" value={stats?.stats.totalDraws} icon={Dices} color="bg-purple-600" />
        <StatCard label="Pending Verifications" value={stats?.stats.pendingVerifications} icon={Award} color="bg-orange-600" />
      </div>
      {stats?.latestDraw && (
        <div className="card">
          <h3 className="font-semibold text-white mb-3">Latest Draw</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {stats.latestDraw.drawNumbers?.map((n) => (
              <span key={n} className="w-9 h-9 rounded-full bg-purple-600/30 border border-purple-500/40 text-purple-200 font-bold flex items-center justify-center text-sm">{n}</span>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div><p className="text-gray-400 text-xs">Total Pool</p><p className="font-semibold text-white">£{stats.latestDraw.totalPool?.toFixed(2)}</p></div>
            <div><p className="text-gray-400 text-xs">Charity Contribution</p><p className="font-semibold text-green-400">£{stats.latestDraw.charityContribution?.toFixed(2)}</p></div>
            <div><p className="text-gray-400 text-xs">Date</p><p className="font-semibold text-white">{new Date(stats.latestDraw.drawDate).toLocaleDateString('en-GB')}</p></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchUsers = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getUsers(p);
      setUsers(data.data.users);
      setPages(data.pages);
      setPage(p);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggle = async (id) => {
    try {
      await adminAPI.toggleUserStatus(id);
      fetchUsers(page);
      toast.success('User status updated');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="card">
      <h3 className="font-semibold text-white mb-4">All Users</h3>
      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-800 rounded-lg animate-pulse" />)}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 text-xs uppercase tracking-wider border-b border-gray-800">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Plan</th>
                <th className="pb-3 pr-4">Sub Status</th>
                <th className="pb-3 pr-4">Charity</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {users.map((u) => (
                <tr key={u._id} className={`${!u.isActive ? 'opacity-50' : ''}`}>
                  <td className="py-3 pr-4 font-medium text-white">{u.name}</td>
                  <td className="py-3 pr-4 text-gray-400">{u.email}</td>
                  <td className="py-3 pr-4 capitalize text-gray-300">{u.subscription?.plan || '—'}</td>
                  <td className="py-3 pr-4">
                    <span className={
                      u.subscription?.status === 'active' ? 'badge-active' :
                      u.subscription?.status === 'past_due' ? 'badge-pending' :
                      'badge-inactive'
                    }>
                      {u.subscription?.status || 'inactive'}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-gray-400 text-xs">{u.charity?.name || '—'}</td>
                  <td className="py-3">
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleToggle(u._id)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                          u.isActive
                            ? 'bg-red-900/40 text-red-400 hover:bg-red-900/60'
                            : 'bg-green-900/40 text-green-400 hover:bg-green-900/60'
                        }`}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button onClick={() => fetchUsers(page - 1)} disabled={page === 1} className="btn-secondary py-1 px-3 text-xs disabled:opacity-40">Prev</button>
              <span className="text-gray-400 text-sm">{page} / {pages}</span>
              <button onClick={() => fetchUsers(page + 1)} disabled={page === pages} className="btn-secondary py-1 px-3 text-xs disabled:opacity-40">Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Charities Tab ─────────────────────────────────────────────────────────────
function CharitiesTab() {
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', description: '', website: '', logo: null });
  const [submitting, setSubmitting] = useState(false);

  const fetchCharities = useCallback(async () => {
    try {
      const { data } = await charityAPI.getAll();
      setCharities(data.data.charities);
    } catch { toast.error('Failed to load charities'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCharities(); }, [fetchCharities]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('description', form.description);
    formData.append('website', form.website);
    if (form.logo) formData.append('logo', form.logo);

    try {
      await adminAPI.createCharity(formData);
      toast.success('Charity created');
      setForm({ name: '', description: '', website: '', logo: null });
      fetchCharities();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete / deactivate this charity?')) return;
    try {
      await adminAPI.deleteCharity(id);
      toast.success('Charity removed');
      fetchCharities();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="font-semibold text-white mb-4">Add Charity</h3>
        <form onSubmit={handleCreate} className="space-y-3">
          <input className="input-field" placeholder="Charity name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <textarea className="input-field h-20 resize-none" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <input className="input-field" placeholder="Website (optional)" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          <div>
            <label className="block text-xs text-gray-400 mb-1">Logo (optional)</label>
            <input 
              type="file" 
              accept="image/*" 
              className="text-xs text-gray-400 file:mr-4 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-800 file:text-gray-300 hover:file:bg-gray-700"
              onChange={(e) => setForm({ ...form, logo: e.target.files[0] })}
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Creating...' : 'Create Charity'}</button>
        </form>
      </div>
      <div className="card">
        <h3 className="font-semibold text-white mb-4">All Charities</h3>
        {loading ? <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-800 rounded-lg animate-pulse" />)}</div> : (
          <ul className="space-y-2">
            {charities.map((c) => (
              <li key={c._id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                <div>
                  <p className="font-medium text-white">{c.name}</p>
                  <p className="text-xs text-gray-400 line-clamp-1">{c.description}</p>
                </div>
                <button onClick={() => handleDelete(c._id)} className="text-xs text-red-400 hover:text-red-300 ml-4">Remove</button>
              </li>
            ))}
            {charities.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No charities found.</p>}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Draw Tab ──────────────────────────────────────────────────────────────────
function DrawTab() {
  const [form, setForm] = useState({ totalPool: '', jackpotRollover: '' });
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);

  const handleRun = async (e) => {
    e.preventDefault();
    if (!window.confirm('Run this month\'s draw? This cannot be undone.')) return;
    setRunning(true);
    setResult(null);
    try {
      const { data } = await adminAPI.runDraw({
        totalPool: parseFloat(form.totalPool) || 0,
        jackpotRollover: parseFloat(form.jackpotRollover) || 0,
      });
      setResult(data);
      toast.success('Draw completed!');
    } catch (err) { toast.error(err.response?.data?.message || 'Draw failed'); }
    finally { setRunning(false); }
  };

  return (
    <div className="card max-w-lg">
      <div className="flex items-center gap-2 mb-5">
        <Dices className="w-5 h-5 text-purple-400" />
        <h3 className="font-semibold text-white">Run Monthly Draw</h3>
      </div>
      <form onSubmit={handleRun} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Total Pool (£)</label>
          <input type="number" min="0" step="0.01" className="input-field" placeholder="e.g. 1200.00" value={form.totalPool} onChange={(e) => setForm({ ...form, totalPool: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Jackpot Rollover (£)</label>
          <input type="number" min="0" step="0.01" className="input-field" placeholder="0.00 if none" value={form.jackpotRollover} onChange={(e) => setForm({ ...form, jackpotRollover: e.target.value })} />
        </div>
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3 text-xs text-blue-300">
          • 5 random numbers (1–45) will be generated<br />
          • Prize split: 40% jackpot, 35% four-match, 25% three-match<br />
          • 10% minimum goes to charities<br />
          • Jackpot rolls over if no 5-match winner
        </div>
        <button type="submit" disabled={running} className="btn-primary w-full flex items-center justify-center gap-2">
          <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
          {running ? 'Running Draw...' : 'Run Draw Now'}
        </button>
      </form>
      {result && (
        <div className="mt-5 bg-green-900/20 border border-green-700/30 rounded-xl p-4">
          <p className="font-semibold text-green-300 mb-2">✅ Draw Results</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {result.data.summary.drawNumbers.map((n) => (
              <span key={n} className="w-8 h-8 rounded-full bg-purple-600/40 text-purple-200 font-bold flex items-center justify-center text-xs">{n}</span>
            ))}
          </div>
          <div className="text-sm text-gray-300 space-y-1">
            <p>Subscribers: <strong className="text-white">{result.data.summary.totalSubscribers}</strong></p>
            <p>5-match: <strong className="text-white">{result.data.summary.winners.fiveMatch}</strong></p>
            <p>4-match: <strong className="text-white">{result.data.summary.winners.fourMatch}</strong></p>
            <p>3-match: <strong className="text-white">{result.data.summary.winners.threeMatch}</strong></p>
            {result.data.summary.jackpotRolledOver && (
              <p className="text-orange-400">⚠️ Jackpot rolled over (no 5-match winner)</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Winners Tab ───────────────────────────────────────────────────────────────
function WinnersTab() {
  const [winners, setWinners] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState('');

  const fetchWinners = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getWinners(statusFilter);
      setWinners(data.data.winners);
    } catch { toast.error('Failed to load winners'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchWinners(); }, [fetchWinners]);

  const handleVerify = async (id, status) => {
    const note = status === 'rejected' ? window.prompt('Reason for rejection (optional):') : '';
    if (note === null) return; // cancelled
    setVerifying(id + status);
    try {
      await adminAPI.verifyWinner(id, { status, note });
      toast.success(`Winner ${status}`);
      fetchWinners();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setVerifying(''); }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-white">Winner Verification</h3>
        <div className="flex gap-1">
          {['pending', 'approved', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                statusFilter === s ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-800 rounded-lg animate-pulse" />)}</div>
      ) : winners.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">No {statusFilter} winners.</p>
      ) : (
        <ul className="space-y-3">
          {winners.map((w) => (
            <li key={w._id} className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-white">{w.user?.name}</p>
                    <span className={
                      w.prizeType === 'five_match' ? 'badge-active' :
                      w.prizeType === 'four_match' ? 'badge-pending' : 'badge-inactive'
                    }>{w.prizeType?.replace('_', ' ')}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{w.user?.email}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Matched: {w.matchedNumbers?.join(', ')} · Prize: <strong className="text-white">£{w.prizeAmount?.toFixed(2)}</strong>
                  </p>
                  {w.proofDocument?.fileUrl && (
                    <a href={w.proofDocument.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline mt-1 inline-block">
                      View proof document ↗
                    </a>
                  )}
                  {!w.proofDocument?.fileUrl && w.verificationStatus === 'pending' && (
                    <p className="text-xs text-orange-400 mt-1">⚠ No proof uploaded yet</p>
                  )}
                </div>
                {w.verificationStatus === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleVerify(w._id, 'approved')}
                      disabled={!!verifying}
                      className="flex items-center gap-1 bg-green-900/40 text-green-400 hover:bg-green-900/60 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => handleVerify(w._id, 'rejected')}
                      disabled={!!verifying}
                      className="flex items-center gap-1 bg-red-900/40 text-red-400 hover:bg-red-900/60 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Admin Dashboard Page ──────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const renderTab = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab />;
      case 'users': return <UsersTab />;
      case 'charities': return <CharitiesTab />;
      case 'draw': return <DrawTab />;
      case 'winners': return <WinnersTab />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-green-400" /> Admin Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage users, charities, draws, and winners.</p>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-1 justify-center ${
                activeTab === key
                  ? 'bg-green-600 text-white shadow'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {renderTab()}
      </main>
    </div>
  );
}
