require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Charity = require('./src/models/Charity');

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const charity = await Charity.findOne(); 
        if (!charity) throw new Error("Please run node seed.js first to create charities.");

        const adminEmail = 'admin@example.com';
        const exists = await User.findOne({ email: adminEmail });
        
        if (!exists) {
            await User.create({
                name: 'System Admin',
                email: adminEmail,
                password: 'password123',
                role: 'admin',
                charity: charity._id,
                subscription: { status: 'active' }
            });
            console.log('✅ Admin user created: admin@example.com / password123');
        } else {
            console.log('✅ Admin user already exists: admin@example.com / password123');
        }
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed failed:', err.message);
        process.exit(1);
    }
};

seedAdmin();
