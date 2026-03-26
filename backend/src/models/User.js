const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters'],
            select: false, // Never send password in queries
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        charity: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Charity',
            required: [true, 'Please select a charity'],
        },
        // Subscription info (synced from Stripe)
        subscription: {
            stripeCustomerId: { type: String },
            stripeSubscriptionId: { type: String },
            plan: { type: String, enum: ['monthly', 'yearly', null], default: null },
            status: {
                type: String,
                enum: ['active', 'inactive', 'cancelled', 'past_due', 'trialing'],
                default: 'inactive',
            },
            currentPeriodEnd: { type: Date },
        },
        // Last 5 scores — enforced at application layer
        scores: {
            type: [
                {
                    score: {
                        type: Number,
                        required: true,
                        min: [1, 'Score must be between 1 and 45'],
                        max: [45, 'Score must be between 1 and 45'],
                    },
                    submittedAt: { type: Date, default: Date.now },
                },
            ],
            validate: {
                validator: (arr) => arr.length <= 5,
                message: 'A user can have at most 5 scores',
            },
        },
        isVerified: { type: Boolean, default: true }, // Email verified flag if needed
        isActive: { type: Boolean, default: true },
        passwordResetToken: { type: String, select: false },
        passwordResetExpires: { type: Date, select: false },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ─── Indexes ────────────────────────────────────────────────────
// Note: email index is auto-created by unique:true above
userSchema.index({ 'subscription.stripeCustomerId': 1 });
userSchema.index({ charity: 1 });

// ─── Pre-save: Hash password ─────────────────────────────────────
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

// ─── Instance Methods ────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.addScore = function (newScore) {
    if (this.scores.length >= 5) {
        // Remove oldest score (first element, sorted by submittedAt)
        this.scores.sort((a, b) => a.submittedAt - b.submittedAt);
        this.scores.shift();
    }
    this.scores.push({ score: newScore, submittedAt: new Date() });
};

userSchema.methods.hasActiveSubscription = function () {
    return (
        this.subscription.status === 'active' ||
        this.subscription.status === 'trialing'
    );
};

// ─── Virtual: isSubscribed ───────────────────────────────────────
userSchema.virtual('isSubscribed').get(function () {
    return this.hasActiveSubscription();
});

module.exports = mongoose.model('User', userSchema);
