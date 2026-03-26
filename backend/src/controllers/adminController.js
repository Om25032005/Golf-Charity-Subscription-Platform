const User = require('../models/User');
const Winner = require('../models/Winner');
const Draw = require('../models/Draw');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// ─── GET /api/admin/users ─────────────────────────────────────────────────── 
const getAllUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.status) filter['subscription.status'] = req.query.status;

    const [users, total] = await Promise.all([
        User.find(filter)
            .populate('charity', 'name')
            .select('-password -passwordResetToken -passwordResetExpires')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        User.countDocuments(filter),
    ]);

    res.status(200).json({
        success: true,
        count: users.length,
        total,
        pages: Math.ceil(total / limit),
        data: { users },
    });
});

// ─── GET /api/admin/users/:id ─────────────────────────────────────────────── 
const getUserById = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id)
        .populate('charity', 'name description')
        .select('-password');

    if (!user) return next(new AppError('User not found.', 404));
    res.status(200).json({ success: true, data: { user } });
});

// ─── PATCH /api/admin/users/:id/status ───────────────────────────────────── 
const toggleUserStatus = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError('User not found.', 404));
    if (user.role === 'admin') return next(new AppError('Cannot deactivate an admin account.', 403));

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
        data: { isActive: user.isActive },
    });
});

// ─── PATCH /api/admin/users/:id/promote ──────────────────────────────────── 
const promoteToAdmin = asyncHandler(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(
        req.params.id,
        { role: 'admin' },
        { new: true }
    );
    if (!user) return next(new AppError('User not found.', 404));
    res.status(200).json({ success: true, message: 'User promoted to admin.', data: { user } });
});

// ─── GET /api/admin/winners ───────────────────────────────────────────────── 
const getPendingWinners = asyncHandler(async (req, res) => {
    const status = req.query.status || 'pending';
    const winners = await Winner.find({ verificationStatus: status })
        .populate('user', 'name email')
        .populate('draw', 'drawNumbers drawDate')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: winners.length,
        data: { winners },
    });
});

// ─── PATCH /api/admin/winners/:id/verify ─────────────────────────────────── 
const verifyWinner = asyncHandler(async (req, res, next) => {
    const { status, note } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
        return next(new AppError('Status must be "approved" or "rejected".', 400));
    }

    const winner = await Winner.findById(req.params.id);
    if (!winner) return next(new AppError('Winner record not found.', 404));
    if (winner.verificationStatus !== 'pending') {
        return next(new AppError('This winner has already been reviewed.', 409));
    }

    winner.verificationStatus = status;
    winner.verificationNote = note || '';
    winner.verifiedBy = req.user._id;
    winner.verifiedAt = new Date();
    await winner.save();

    res.status(200).json({
        success: true,
        message: `Winner ${status}.`,
        data: { winner },
    });
});

// ─── GET /api/admin/dashboard-stats ─────────────────────────────────────────
const getDashboardStats = asyncHandler(async (req, res) => {
    const [
        totalUsers,
        activeSubscribers,
        totalDraws,
        pendingVerifications,
    ] = await Promise.all([
        User.countDocuments({ role: 'user' }),
        User.countDocuments({ 'subscription.status': { $in: ['active', 'trialing'] } }),
        Draw.countDocuments({ status: 'completed' }),
        Winner.countDocuments({ verificationStatus: 'pending' }),
    ]);

    const latestDraw = await Draw.findOne({ status: 'completed' }).sort({ drawDate: -1 })
        .select('drawDate drawNumbers totalPool charityContribution');

    res.status(200).json({
        success: true,
        data: {
            stats: { totalUsers, activeSubscribers, totalDraws, pendingVerifications },
            latestDraw,
        },
    });
});

module.exports = {
    getAllUsers,
    getUserById,
    toggleUserStatus,
    promoteToAdmin,
    getPendingWinners,
    verifyWinner,
    getDashboardStats,
};
