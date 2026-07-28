'use strict';

const { Op } = require('sequelize');
const sequelize = require('./src/config/database');
const User = require('./src/model/User');

async function run() {
  const users = await User.findAll({ where: { email: { [Op.iLike]: '%@connectflow.com' } } });

  if (users.length === 0) {
    console.log('No users with @connectflow.com emails found.');
    await sequelize.close();
    return;
  }

  for (const user of users) {
    const oldEmail = user.email;
    const newEmail = oldEmail.replace(/@connectflow\.com$/i, '@gmail.com');
    await user.update({ email: newEmail });
    console.log(`${oldEmail} -> ${newEmail}`);
  }

  console.log(`Updated ${users.length} user email(s).`);
  await sequelize.close();
}

run().catch((err) => {
  console.error('[Migrate emails] Failed:', err);
  process.exit(1);
});
