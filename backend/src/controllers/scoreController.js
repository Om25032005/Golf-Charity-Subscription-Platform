const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// ─── GET /api/scores/my ──────────────────────────────────────────────────────
const getMyScores = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('scores');
    const sortedScores = user.scores.sort((a, b) => b.submittedAt - a.submittedAt);

    res.status(200).json({
        success: true,
        count: sortedScores.length,
        data: { scores: sortedScores },
    });
});

// ─── POST /api/scores ────────────────────────────────────────────────────────
// Only active subscribers can submit scores
const submitScore = asyncHandler(async (req, res, next) => {
    const { score } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.hasActiveSubscription()) {
        return next(new AppError('You need an active subscription to submit scores.', 403));
    }

    // addScore handles the "keep last 5, remove oldest" logic
    user.addScore(Number(score));
    await user.save();

    res.status(201).json({
        success: true,
        message: 'Score submitted successfully.',
        data: {
            scores: user.scores.sort((a, b) => b.submittedAt - a.submittedAt),
        },
    });
});

// ─── DELETE /api/scores/:scoreId ─────────────────────────────────────────────
const deleteScore = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user._id);
    const scoreIndex = user.scores.findIndex(
        (s) => s._id.toString() === req.params.scoreId
    );

    if (scoreIndex === -1) return next(new AppError('Score not found.', 404));

    user.scores.splice(scoreIndex, 1);
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Score removed.',
        data: { scores: user.scores },
    });
});

// ─── PUT /api/scores/:scoreId ────────────────────────────────────────────────
const updateScore = asyncHandler(async (req, res, next) => {
    const { score } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.hasActiveSubscription()) {
        return next(new AppError('You need an active subscription to update scores.', 403));
    }

    const scoreToUpdate = user.scores.id(req.params.scoreId);
    if (!scoreToUpdate) {
        return next(new AppError('Score not found.', 404));
    }

    scoreToUpdate.score = Number(score);
    scoreToUpdate.submittedAt = Date.now();
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Score updated successfully.',
        data: {
            scores: user.scores.sort((a, b) => b.submittedAt - a.submittedAt),
        },
    });
});

module.exports = { getMyScores, submitScore, deleteScore, updateScore };
