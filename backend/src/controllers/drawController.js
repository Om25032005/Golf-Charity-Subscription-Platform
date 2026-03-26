const Draw = require('../models/Draw');
const Winner = require('../models/Winner');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Generate 5 unique random numbers between 1 and 45 (inclusive)
 */
const generateDrawNumbers = () => {
    const numbers = new Set();
    while (numbers.size < 5) {
        numbers.add(Math.floor(Math.random() * 45) + 1);
    }
    return [...numbers];
};

/**
 * Calculate prize amounts based on pool and jackpot rollover
 */
const calculatePrizes = (totalPool, jackpotRollover) => {
    const charityContribution = totalPool * 0.10;
    const prizeFund = totalPool - charityContribution;

    return {
        fiveMatch: prizeFund * 0.40 + jackpotRollover,
        fourMatch: prizeFund * 0.35,
        threeMatch: prizeFund * 0.25,
        charityContribution,
    };
};

// ─── POST /api/admin/draws/run ───────────────────────────────────────────────
const runDraw = asyncHandler(async (req, res, next) => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Prevent duplicate draw for same month/year
    const existingDraw = await Draw.findOne({ month, year });
    if (existingDraw && existingDraw.status === 'completed') {
        return next(new AppError(`A draw for ${month}/${year} has already been completed.`, 409));
    }

    // Fetch all active subscribers
    const subscribers = await User.find({
        'subscription.status': { $in: ['active', 'trialing'] },
        isActive: true,
    }).select('scores name email charity');

    if (subscribers.length === 0) {
        return next(new AppError('No active subscribers found for this draw.', 400));
    }

    // Calculate pool from subscription revenue (simplified — real implementation reads Stripe invoices)
    const totalPool = req.body.totalPool || 0; // Admin provides or fetched from Stripe
    // Fetch latest jackpot rollover if not provided
    let jackpotRollover = req.body.jackpotRollover;
    if (jackpotRollover === undefined || jackpotRollover === null || jackpotRollover === '') {
        jackpotRollover = await Draw.getLatestJackpotRollover();
    } else {
        jackpotRollover = parseFloat(jackpotRollover) || 0;
    }

    const drawNumbers = generateDrawNumbers();
    const drawNumberSet = new Set(drawNumbers);
    const prizes = calculatePrizes(totalPool, jackpotRollover);

    const winnersData = { fiveMatch: [], fourMatch: [], threeMatch: [] };

    // Match each subscriber's scores
    for (const subscriber of subscribers) {
        for (const scoreEntry of subscriber.scores) {
            if (drawNumberSet.has(scoreEntry.score)) {
                // Find how many of this user's scores are in the draw
                const matchedScores = subscriber.scores
                    .map((s) => s.score)
                    .filter((s) => drawNumberSet.has(s));

                const uniqueMatches = [...new Set(matchedScores)];
                const matchCount = uniqueMatches.length;

                if (matchCount >= 3) {
                    const entry = {
                        user: subscriber._id,
                        matchedNumbers: uniqueMatches,
                        matchCount,
                    };
                    if (matchCount === 5) winnersData.fiveMatch.push(entry);
                    else if (matchCount === 4) winnersData.fourMatch.push(entry);
                    else winnersData.threeMatch.push(entry);
                }
                break; // Only process each user once
            }
        }
    }

    // Handle jackpot rollover if no 5-match winner
    const hasJackpotWinner = winnersData.fiveMatch.length > 0;
    const newJackpotRollover = hasJackpotWinner ? 0 : prizes.fiveMatch;

    // Split prizes among multiple winners in same tier
    const splitPrize = (amount, count) => (count > 0 ? amount / count : 0);

    // Create Draw document
    const draw = await Draw.create({
        drawDate: now,
        drawNumbers,
        totalPool,
        jackpotRollover: newJackpotRollover,
        prizeBreakdown: {
            fiveMatch: {
                amount: hasJackpotWinner ? splitPrize(prizes.fiveMatch, winnersData.fiveMatch.length) : 0,
                winners: winnersData.fiveMatch.map((w) => w.user),
                rolledOver: !hasJackpotWinner,
            },
            fourMatch: {
                amount: splitPrize(prizes.fourMatch, winnersData.fourMatch.length),
                winners: winnersData.fourMatch.map((w) => w.user),
            },
            threeMatch: {
                amount: splitPrize(prizes.threeMatch, winnersData.threeMatch.length),
                winners: winnersData.threeMatch.map((w) => w.user),
            },
        },
        charityContribution: prizes.charityContribution,
        status: 'completed',
        runBy: req.user._id,
        month,
        year,
    });

    // Create Winner records for verification workflow
    const winnerDocs = [];

    const createWinners = (list, prizeType, amount) => {
        for (const w of list) {
            winnerDocs.push({
                user: w.user,
                draw: draw._id,
                matchedNumbers: w.matchedNumbers,
                matchCount: w.matchCount,
                prizeAmount: amount,
                prizeType,
                verificationStatus: 'pending',
            });
        }
    };

    if (hasJackpotWinner) {
        createWinners(
            winnersData.fiveMatch,
            'five_match',
            splitPrize(prizes.fiveMatch, winnersData.fiveMatch.length)
        );
    }
    createWinners(
        winnersData.fourMatch,
        'four_match',
        splitPrize(prizes.fourMatch, winnersData.fourMatch.length)
    );
    createWinners(
        winnersData.threeMatch,
        'three_match',
        splitPrize(prizes.threeMatch, winnersData.threeMatch.length)
    );

    if (winnerDocs.length > 0) {
        await Winner.insertMany(winnerDocs);
    }

    res.status(201).json({
        success: true,
        message: `Draw completed. ${winnerDocs.length} winner(s) found.`,
        data: {
            draw,
            summary: {
                drawNumbers,
                totalSubscribers: subscribers.length,
                jackpotRolledOver: !hasJackpotWinner,
                newJackpotRollover,
                winners: {
                    fiveMatch: winnersData.fiveMatch.length,
                    fourMatch: winnersData.fourMatch.length,
                    threeMatch: winnersData.threeMatch.length,
                },
            },
        },
    });
});

// ─── GET /api/draws ──────────────────────────────────────────────────────────
const getDrawHistory = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [draws, total] = await Promise.all([
        Draw.find({ status: 'completed' })
            .sort({ drawDate: -1 })
            .skip(skip)
            .limit(limit)
            .select('-prizeBreakdown.fiveMatch.winners -prizeBreakdown.fourMatch.winners -prizeBreakdown.threeMatch.winners'),
        Draw.countDocuments({ status: 'completed' }),
    ]);

    res.status(200).json({
        success: true,
        count: draws.length,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        data: { draws },
    });
});

// ─── GET /api/draws/latest ───────────────────────────────────────────────────
const getLatestDraw = asyncHandler(async (req, res, next) => {
    const draw = await Draw.findOne({ status: 'completed' }).sort({ drawDate: -1 });
    if (!draw) return next(new AppError('No draws have been run yet.', 404));

    res.status(200).json({ success: true, data: { draw } });
});

// ─── GET /api/draws/my-results ───────────────────────────────────────────────
const getMyDrawResults = asyncHandler(async (req, res) => {
    const winners = await Winner.find({ user: req.user._id })
        .populate('draw', 'drawNumbers drawDate month year')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: winners.length,
        data: { winners },
    });
});

module.exports = { runDraw, getDrawHistory, getLatestDraw, getMyDrawResults };
