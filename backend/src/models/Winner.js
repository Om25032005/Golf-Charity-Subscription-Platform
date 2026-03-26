const mongoose = require('mongoose');

const winnerSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        draw: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Draw',
            required: true,
        },
        matchedNumbers: {
            type: [Number],
            required: true,
        },
        matchCount: {
            type: Number,
            required: true,
            enum: [3, 4, 5],
        },
        prizeAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        prizeType: {
            type: String,
            enum: ['three_match', 'four_match', 'five_match'],
            required: true,
        },
        // Proof of eligibility (active subscription at time of draw)
        proofDocument: {
            fileUrl: { type: String },
            fileName: { type: String },
            uploadedAt: { type: Date },
        },
        verificationStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        verificationNote: { type: String },
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        verifiedAt: { type: Date },
        isPaid: { type: Boolean, default: false },
        paidAt: { type: Date },
    },
    {
        timestamps: true,
    }
);

winnerSchema.index({ user: 1, draw: 1 });
winnerSchema.index({ verificationStatus: 1 });
winnerSchema.index({ draw: 1 });

module.exports = mongoose.model('Winner', winnerSchema);
