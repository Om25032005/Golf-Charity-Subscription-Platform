require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Charity = require('./src/models/Charity');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const charity = await Charity.findOne({ isActive: true });
  if (!charity) throw new Error('No charity found - run seed.js first');

  const u = new User({
    name: 'Unit Test',
    email: 'unittest_presave@test.com',
    password: 'Test@1234',
    charity: charity._id,
  });
  await u.save();
  const hashed = u.password.startsWith('$2');
  console.log('✅ User saved. Password hashed:', hashed);
  await User.deleteOne({ email: 'unittest_presave@test.com' });
  console.log('✅ Cleanup done');
  process.exit(0);
}).catch((e) => {
  console.error('❌ FAIL:', e.message);
  process.exit(1);
});
