const bcrypt = require('bcryptjs');

const password = '12345678';
const saltRounds = 10;

bcrypt.genSalt(saltRounds)
  .then((salt) => bcrypt.hash(password, salt))
  .then((hash) => {
    console.log(hash);
  })
  .catch((err) => {
    console.error('Hash error:', err);
    process.exit(1);
  });


