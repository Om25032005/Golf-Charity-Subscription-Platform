const mongoose = require('mongoose');

const charitySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Charity name is required'],
            trim: true,
            unique: true,
            maxlength: [200, 'Name cannot exceed 200 characters'],
        },
        description: {
            type: String,
            required: [true, 'Charity description is required'],
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
        },
        logo: {
            type: String, // URL or relative path
            default: null,
        },
        registrationNumber: {
            type: String,
            trim: true,
        },
        website: {
            type: String,
            trim: true,
        },
        // Accumulated charity funds
        totalFundsReceived: {
            type: Number,
            default: 0,
            min: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indicies
charitySchema.index({ isActive: 1 });

// Virtual: count of users supporting this charity
charitySchema.virtual('memberCount', {
    ref: 'User',
    localField: '_id',
    foreignField: 'charity',
    count: true,
});

module.exports = mongoose.model('Charity', charitySchema);
