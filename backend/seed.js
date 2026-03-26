require('dotenv').config();
const mongoose = require('mongoose');
const Charity = require('./src/models/Charity');

const charities = [
  {
    name: 'Golf Foundation',
    description: 'Helping young people enjoy and benefit from golf across the UK.',
    website: 'https://golf-foundation.org.uk',
  },
  {
    name: 'MacMillan Cancer Support',
    description: 'Supporting people living with cancer and their families.',
    website: 'https://www.macmillan.org.uk',
  },
  {
    name: 'Help for Heroes',
    description: 'Supporting wounded, injured and sick veterans and their families.',
    website: 'https://www.helpforheroes.org.uk',
  },
  {
    name: 'Royal British Legion',
    description: 'Providing lifelong support for the Armed Forces community.',
    website: 'https://www.britishlegion.org.uk',
  },
  {
    name: 'Children in Need',
    description: "Making a positive difference to disabled children and young people's lives across the UK.",
    website: 'https://www.bbcchildreninneed.co.uk',
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Only insert charities that don't already exist
    let created = 0;
    for (const c of charities) {
      const exists = await Charity.findOne({ name: c.name });
      if (!exists) {
        await Charity.create(c);
        console.log(`  ➕ Created: ${c.name}`);
        created++;
      } else {
        console.log(`  ⏭  Skipped (already exists): ${c.name}`);
      }
    }

    console.log(`\n✅ Seed complete — ${created} charities added.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
