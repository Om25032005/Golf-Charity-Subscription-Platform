const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const { charityValidation } = require('../validators');

const {
    getAllUsers,
    getUserById,
    toggleUserStatus,
    promoteToAdmin,
    getPendingWinners,
    verifyWinner,
    getDashboardStats,
} = require('../controllers/adminController');

const {
    createCharity,
    updateCharity,
    deleteCharity,
} = require('../controllers/charityController');

const { runDraw } = require('../controllers/drawController');

const Winner = require('../models/Winner');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// All admin routes require auth + admin role
router.use(protect, restrictTo('admin'));

// ─── Dashboard ─────────────────────────────────────────────────────────────
router.get('/dashboard-stats', getDashboardStats);

// ─── User Management ───────────────────────────────────────────────────────
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/status', toggleUserStatus);
router.patch('/users/:id/promote', promoteToAdmin);

// ─── Charity Management ────────────────────────────────────────────────────
router.post('/charities', upload.single('logo'), ...charityValidation, validate, createCharity);
router.patch('/charities/:id', upload.single('logo'), updateCharity);
router.delete('/charities/:id', deleteCharity);

// ─── Draw Management ───────────────────────────────────────────────────────
router.post('/draws/run', runDraw);

// ─── Winner Verification ───────────────────────────────────────────────────
router.get('/winners', getPendingWinners);
router.patch('/winners/:id/verify', verifyWinner);

// ─── Winner Proof Upload (by winner themselves, not admin) ─────────────────
// Note: This is under admin namespace but protected by protect middleware at app level
// Separated for clarity — winner uploads their own proof
const uploadProof = asyncHandler(async (req, res, next) => {
    const winner = await Winner.findOne({ _id: req.params.id, user: req.user._id });
    if (!winner) return next(new AppError('Winner record not found.', 404));
    if (!req.file) return next(new AppError('Please upload a proof document.', 400));

    winner.proofDocument = {
        fileUrl: `/uploads/proofs/${req.file.filename}`,
        fileName: req.file.originalname,
        uploadedAt: new Date(),
    };
    await winner.save();

    res.status(200).json({
        success: true,
        message: 'Proof uploaded. Awaiting admin verification.',
        data: { proofDocument: winner.proofDocument },
    });
});

module.exports = router;

// Export uploadProof separately for use in app.js
module.exports.uploadProof = uploadProof;
