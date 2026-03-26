const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const globalErrorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

// Route imports
const authRoutes = require('./routes/authRoutes');
const charityRoutes = require('./routes/charityRoutes');
const scoreRoutes = require('./routes/scoreRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const drawRoutes = require('./routes/drawRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Webhook handler
const { handleWebhook } = require('./controllers/subscriptionController');
const { protect } = require('./middleware/auth');
const upload = require('./middleware/upload');
const Winner = require('./models/Winner');
const asyncHandler = require('./utils/asyncHandler');

const app = express();

// ─── Security Headers ─────────────────────────────────────────────
app.use(helmet());

// ─── CORS FIX (IMPORTANT) ─────────────────────────────────────────
const allowedOrigins = [
    process.env.CLIENT_URL,
    "http://localhost:3000"
];

app.use(cors({
    origin: function (origin, callback) {
        console.log("Request origin:", origin);
        console.log("Allowed origins:", allowedOrigins);

        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("CORS not allowed"));
        }
    },
    credentials: true
}));

// ✅ VERY IMPORTANT (handles preflight)
app.options("*", cors());
// ─── Stripe Webhook (must be before json parser) ──────────────────
app.post(
    '/api/subscriptions/webhook',
    express.raw({ type: 'application/json' }),
    handleWebhook
);

// ─── Body Parser ──────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── Logging ──────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// ─── Static Files ─────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── API Routes ───────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/charities', charityRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/draws', drawRoutes);
app.use('/api/admin', adminRoutes);

// ─── Winner Proof Upload ──────────────────────────────────────────
app.post(
    '/api/winners/:id/upload-proof',
    protect,
    upload.single('proof'),
    asyncHandler(async (req, res, next) => {
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
    })
);

// ─── Health Check ─────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Golf Charity API is running.',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV,
    });
});

// ─── 404 Handler ──────────────────────────────────────────────────
app.all('/{*path}', (req, res, next) => {
    next(new AppError(`Cannot find ${req.method} ${req.originalUrl} on this server.`, 404));
});

// ─── Global Error Handler ─────────────────────────────────────────
app.use(globalErrorHandler);

module.exports = app;