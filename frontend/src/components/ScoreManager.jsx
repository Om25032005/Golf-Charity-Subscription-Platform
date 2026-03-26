import { useState, useEffect, useCallback } from 'react';
import { scoreAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Target, Trash2, Plus, AlertCircle } from 'lucide-react';

export default function ScoreManager() {
  const { user } = useAuth();
  const [scores, setScores] = useState([]);
  const [newScore, setNewScore] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Edit state
  const [editingScoreId, setEditingScoreId] = useState(null);
  const [editScoreValue, setEditScoreValue] = useState('');

  const fetchScores = useCallback(async () => {
    try {
      const { data } = await scoreAPI.getMyScores();
      setScores(data.data.scores);
    } catch {
      toast.error('Failed to load scores');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchScores(); }, [fetchScores]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const score = parseInt(newScore);
    if (!score || score < 1 || score > 45) {
      toast.error('Score must be between 1 and 45');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await scoreAPI.submitScore(score);
      setScores(data.data.scores);
      setNewScore('');
      toast.success('Score submitted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit score');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (scoreId) => {
    try {
      const { data } = await scoreAPI.deleteScore(scoreId);
      setScores(data.data.scores);
      toast.success('Score removed');
      await refreshUser();
    } catch {
      toast.error('Failed to remove score');
    }
  };

  const handleEditSubmit = async (e, scoreId) => {
    e.preventDefault();
    const score = parseInt(editScoreValue);
    if (!score || score < 1 || score > 45) {
      toast.error('Score must be between 1 and 45');
      return;
    }
    if (scores.some(s => s._id !== scoreId && s.score === score)) {
      toast.error('You already have this number');
      return;
    }
    
    try {
      const { data } = await scoreAPI.updateScore(scoreId, score);
      setScores(data.data.scores);
      setEditingScoreId(null);
      setEditScoreValue('');
      toast.success('Score updated!');
      await refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update score');
    }
  };

  const startEditing = (scoreObj) => {
    setEditingScoreId(scoreObj._id);
    setEditScoreValue(scoreObj.score.toString());
  };

  const isSubscribed = user?.subscription?.status === 'active' || user?.subscription?.status === 'trialing';

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center">
          <Target className="w-4 h-4 text-green-400" />
        </div>
        <div>
          <h2 className="font-semibold text-white">My Scores</h2>
          <p className="text-xs text-gray-400">{scores.length}/5 slots used</p>
        </div>
      </div>

      {!isSubscribed && (
        <div className="flex items-start gap-2 bg-yellow-900/30 border border-yellow-700/40 rounded-lg p-3 mb-4">
          <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
          <p className="text-xs text-yellow-300">
            You need an active subscription to submit scores.
          </p>
        </div>
      )}

      {/* Submit form */}
      {isSubscribed && (
        <form onSubmit={handleSubmit} className="flex gap-2 mb-5">
          <input
            type="number"
            min="1"
            max="45"
            value={newScore}
            onChange={(e) => setNewScore(e.target.value)}
            placeholder="Enter score (1–45)"
            className="input-field flex-1"
          />
          <button
            type="submit"
            disabled={submitting || !newScore}
            className="btn-primary flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            {submitting ? 'Adding...' : 'Add'}
          </button>
        </form>
      )}

      {/* Score list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : scores.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No scores yet. Submit your first score!</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {scores
            .slice()
            .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
            .map((s, i) => (
              <li
                key={s._id}
                className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3 group border border-transparent hover:border-gray-700 transition"
              >
                {editingScoreId === s._id ? (
                  <form onSubmit={(e) => handleEditSubmit(e, s._id)} className="flex items-center gap-2 w-full">
                    <input
                      type="number"
                      min="1"
                      max="45"
                      value={editScoreValue}
                      onChange={(e) => setEditScoreValue(e.target.value)}
                      className="input-field max-w-[100px] py-1 px-2"
                      required
                      autoFocus
                    />
                    <button type="submit" className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded">
                      Save
                    </button>
                    <button type="button" onClick={() => setEditingScoreId(null)} className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-3 py-1.5 rounded">
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center gap-3 w-full">
                      <span className="w-6 h-6 rounded-full bg-green-600/30 text-green-400 text-xs font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <span className="text-white font-semibold text-lg">{s.score}</span>
                        <p className="text-xs text-gray-500">
                          {new Date(s.submittedAt).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </p>
                      </div>
                      
                      {i === scores.length - 1 && scores.length === 5 && (
                        <span className="text-xs text-orange-400 shrink-0 mr-3 hidden sm:block">oldest</span>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditing(s)}
                          className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 p-1.5 rounded-md transition-colors"
                          title="Edit score"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        </button>
                        <button
                          onClick={() => handleDelete(s._id)}
                          className="bg-red-600/20 hover:bg-red-600/40 text-red-400 p-1.5 rounded-md transition-colors"
                          title="Remove score"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </li>
            ))}
        </ul>
      )}

      {scores.length === 5 && (
        <p className="text-xs text-gray-500 mt-3 text-center">
          Maximum 5 scores stored — adding a new one will remove the oldest.
        </p>
      )}
    </div>
  );
}
