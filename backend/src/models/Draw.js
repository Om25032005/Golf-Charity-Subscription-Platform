const mongoose = require('mongoose');

const PRIZE_TIERS = {
    FIVE_MATCH: { matches: 5, poolPercent: 40, isJackpot: true },
    FOUR_MATCH: { matches: 4, poolPercent: 35, isJackpot: false },
    THREE_MATCH: { matches: 3, poolPercent: 25, isJackpot: false },
};

const drawSchema = new mongoose.Schema(
    {
        drawDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        drawNumbers: {
            type: [Number],
            required: true,
            validate: {
                validator: (arr) =>
                    arr.length === 5 && arr.every((n) => n >= 1 && n <= 45),
                message: 'Draw must contain exactly 5 numbers between 1 and 45',
            },
        },
        totalPool: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        jackpotRollover: {
            type: Number,
            default: 0,
            min: 0,
        },
        // Breakdown of prizes paid
        prizeBreakdown: {
            fiveMatch: {
                amount: { type: Number, default: 0 },
                winners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
                rolledOver: { type: Boolean, default: false },
            },
            fourMatch: {
                amount: { type: Number, default: 0 },
                winners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
            },
            threeMatch: {
                amount: { type: Number, default: 0 },
                winners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
            },
        },
        charityContribution: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'cancelled'],
            default: 'pending',
        },
        runBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        month: { type: Number, required: true }, // 1-12
        year: { type: Number, required: true },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

drawSchema.index({ year: 1, month: 1 }, { unique: true });
drawSchema.index({ status: 1 });
drawSchema.index({ drawDate: -1 });

drawSchema.statics.PRIZE_TIERS = PRIZE_TIERS;

/**
 * Get the latest jackpot rollover from the most recently completed draw
 */
drawSchema.statics.getLatestJackpotRollover = async function () {
    const lastDraw = await this.findOne({ status: 'completed' }).sort({ drawDate: -1 });
    return lastDraw ? lastDraw.jackpotRollover : 0;
};

module.exports = mongoose.model('Draw', drawSchema);
