const Charity = require('../models/Charity');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// ─── GET /api/charities ──────────────────────────────────────────────────────
const getAllCharities = asyncHandler(async (req, res) => {
    const charities = await Charity.find({ isActive: true })
        .select('name description logo website')
        .sort('name');

    res.status(200).json({
        success: true,
        count: charities.length,
        data: { charities },
    });
});

// ─── GET /api/charities/:id ──────────────────────────────────────────────────
const getCharity = asyncHandler(async (req, res, next) => {
    const charity = await Charity.findById(req.params.id).populate('memberCount');
    if (!charity) return next(new AppError('Charity not found.', 404));

    res.status(200).json({ success: true, data: { charity } });
});

// ─── POST /api/admin/charities ───────────────────────────────────────────────
const createCharity = asyncHandler(async (req, res) => {
    const { name, description, registrationNumber, website } = req.body;
    const logo = req.file ? `/uploads/logos/${req.file.filename}` : undefined;

    const charity = await Charity.create({
        name,
        description,
        registrationNumber,
        website,
        logo,
        createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: { charity } });
});

// ─── PATCH /api/admin/charities/:id ─────────────────────────────────────────
const updateCharity = asyncHandler(async (req, res, next) => {
    const updates = (({ name, description, registrationNumber, website, isActive }) => ({
        name, description, registrationNumber, website, isActive,
    }))(req.body);

    if (req.file) updates.logo = `/uploads/logos/${req.file.filename}`;

    const charity = await Charity.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true,
    });
    if (!charity) return next(new AppError('Charity not found.', 404));

    res.status(200).json({ success: true, data: { charity } });
});

// ─── DELETE /api/admin/charities/:id ────────────────────────────────────────
const deleteCharity = asyncHandler(async (req, res, next) => {
    const charity = await Charity.findById(req.params.id);
    if (!charity) return next(new AppError('Charity not found.', 404));

    // Soft delete — don't remove if users are still linked
    const memberCount = await User.countDocuments({ charity: req.params.id });
    if (memberCount > 0) {
        charity.isActive = false;
        await charity.save();
        return res.status(200).json({
            success: true,
            message: `Charity deactivated (${memberCount} users still linked).`,
        });
    }

    await charity.deleteOne();
    res.status(204).json({ success: true, data: null });
});

module.exports = {
    getAllCharities,
    getCharity,
    createCharity,
    updateCharity,
    deleteCharity,
};
