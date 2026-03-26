const User = require('../models/User');
const Charity = require('../models/Charity');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendTokenResponse } = require('../utils/jwt');

// ─── POST /api/auth/signup ───────────────────────────────────────────────────
const signup = asyncHandler(async (req, res, next) => {
    const { name, email, password, charity } = req.body;

    // Ensure charity exists and is active
    const charityDoc = await Charity.findById(charity);
    if (!charityDoc || !charityDoc.isActive) {
        return next(new AppError('Selected charity not found or inactive.', 400));
    }

    // Check duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return next(new AppError('An account with this email already exists.', 409));
    }

    const user = await User.create({ name, email, password, charity });

    // Populate charity for response
    await user.populate('charity', 'name description logo');

    sendTokenResponse(user, 201, res);
});

// ─── POST /api/auth/login ────────────────────────────────────────────────────
const login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // Explicitly select password for comparison
    const user = await User.findOne({ email }).select('+password').populate('charity', 'name logo');
    if (!user) {
        return next(new AppError('Invalid email or password.', 401));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        return next(new AppError('Invalid email or password.', 401));
    }

    if (!user.isActive) {
        return next(new AppError('Your account has been deactivated. Please contact support.', 401));
    }

    sendTokenResponse(user, 200, res);
});

// ─── GET /api/auth/me ────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user._id)
        .populate('charity', 'name description logo website');

    res.status(200).json({
        success: true,
        data: { user },
    });
});

// ─── POST /api/auth/logout ───────────────────────────────────────────────────
// JWT is stateless; logout is handled client-side by discarding the token.
// If you use refresh tokens stored in DB, invalidate them here.
const logout = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Logged out successfully. Please discard your token.',
    });
});

// ─── PATCH /api/auth/change-password ────────────────────────────────────────
const changePassword = asyncHandler(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        return next(new AppError('Current password is incorrect.', 401));
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
});

module.exports = { signup, login, getMe, logout, changePassword };
