import { useState, useEffect, useCallback } from 'react';
import { drawAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Dices, TrendingUp, Award } from 'lucide-react';
import WinnerProofUpload from './WinnerProofUpload';

const PRIZE_LABEL = {
  five_match: { label: '5 Match 🏆', color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-700/40' },
  four_match: { label: '4 Match 🥈', color: 'text-gray-300', bg: 'bg-gray-800 border-gray-700' },
  three_match: { label: '3 Match 🥉', color: 'text-orange-400', bg: 'bg-orange-900/20 border-orange-700/40' },
};

export default function DrawResults() {
  const [latestDraw, setLatestDraw] = useState(null);
  const [myResults, setMyResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState({}); // { winnerId: boolean }

  const fetchData = useCallback(async () => {
    try {
      const [drawRes, myRes] = await Promise.all([drawAPI.getLatest(), drawAPI.getMyResults()]);
      setLatestDraw(drawRes.data.data.draw);
      setMyResults(myRes.data.data.winners);
    } catch (err) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleUpload = (id) => setShowUpload(prev => ({ ...prev, [id]: !prev[id] }));

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-5 bg-gray-700 rounded w-1/3 mb-4" />
        <div className="h-24 bg-gray-800 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Latest Draw */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
            <Dices className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Latest Draw</h2>
            {latestDraw && (
              <p className="text-xs text-gray-400">
                {new Date(latestDraw.drawDate).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            )}
          </div>
        </div>

        {!latestDraw ? (
          <div className="text-center py-8 text-gray-500">
            <Dices className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No draws have been run yet.</p>
          </div>
        ) : (
          <>
            {/* Draw numbers */}
            <div className="flex flex-wrap gap-2 mb-4">
              {latestDraw.drawNumbers.map((n) => (
                <span
                  key={n}
                  className="w-10 h-10 rounded-full bg-purple-600/30 border border-purple-500/40 text-purple-200 font-bold flex items-center justify-center text-sm"
                >
                  {n}
                </span>
              ))}
            </div>

            {/* Prize breakdown */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: '5-Match', amount: latestDraw.prizeBreakdown?.fiveMatch?.amount, rolledOver: latestDraw.prizeBreakdown?.fiveMatch?.rolledOver },
                { label: '4-Match', amount: latestDraw.prizeBreakdown?.fourMatch?.amount },
                { label: '3-Match', amount: latestDraw.prizeBreakdown?.threeMatch?.amount },
              ].map((tier) => (
                <div key={tier.label} className="bg-gray-800 rounded-lg p-2.5">
                  <p className="text-xs text-gray-400">{tier.label}</p>
                  {tier.rolledOver ? (
                    <p className="text-xs font-semibold text-orange-400 mt-0.5">Rolled Over</p>
                  ) : (
                    <p className="text-sm font-bold text-white mt-0.5">
                      £{(tier.amount || 0).toFixed(2)}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {latestDraw.jackpotRollover > 0 && (
              <div className="mt-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg px-3 py-2 text-xs text-yellow-300">
                🏆 Jackpot rollover: <strong>£{latestDraw.jackpotRollover.toFixed(2)}</strong>
              </div>
            )}
          </>
        )}
      </div>

      {/* My Draw Results */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center">
            <Award className="w-4 h-4 text-green-400" />
          </div>
          <h2 className="font-semibold text-white">My Winnings</h2>
        </div>

        {myResults.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No winnings yet. Keep playing!</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {myResults.map((w) => {
              const tier = PRIZE_LABEL[w.prizeType] || {};
              const needsProof = (w.verificationStatus === 'pending' && !w.proofDocument) || w.verificationStatus === 'rejected';
              
              return (
                <li
                  key={w._id}
                  className={`border rounded-xl overflow-hidden ${tier.bg}`}
                >
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className={`font-semibold text-sm ${tier.color}`}>{tier.label}</p>
                      <p className="text-xs text-gray-400">
                        Draw: {w.draw?.month}/{w.draw?.year} · Matched:{' '}
                        {w.matchedNumbers.join(', ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">£{(w.prizeAmount || 0).toFixed(2)}</p>
                      <button 
                        onClick={() => needsProof && toggleUpload(w._id)}
                        className={`text-xs font-medium underline-offset-2 ${needsProof ? 'hover:underline cursor-pointer' : ''} ${
                          w.verificationStatus === 'approved' ? 'text-green-400' :
                          w.verificationStatus === 'rejected' ? 'text-red-400' :
                          'text-yellow-400'
                        }`}
                      >
                        {w.verificationStatus} {needsProof && !showUpload[w._id] && ' (Action Required)'}
                      </button>
                    </div>
                  </div>

                  {needsProof && showUpload[w._id] && (
                    <div className="px-4 pb-4 border-t border-gray-700/50 pt-3">
                      <WinnerProofUpload winnerId={w._id} onUploaded={() => { fetchData(); setShowUpload(p => ({ ...p, [w._id]: false })); }} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
