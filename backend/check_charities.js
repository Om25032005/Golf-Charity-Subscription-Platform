const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: 'c:/project/Assignment/backend/.env' });

const Charity = require('./src/models/Charity');

async function checkCharities() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const count = await Charity.countDocuments();
        const activeCount = await Charity.countDocuments({ isActive: true });
        const charities = await Charity.find();
        
        console.log(`Total Charities: ${count}`);
        console.log(`Active Charities: ${activeCount}`);
        console.log('Charity Names:', charities.map(c => c.name));
        
        // If 0, seed some
        if (count === 0) {
            console.log('Seeding initial charities...');
            await Charity.create([
                { name: 'Children in Need', description: 'Helping children across the UK.', isActive: true },
                { name: 'Red Cross', description: 'International humanitarian movement.', isActive: true },
                { name: 'Cancer Research UK', description: 'Pioneering life-saving research.', isActive: true },
            ]);
            console.log('Seeding complete.');
        }
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkCharities();
