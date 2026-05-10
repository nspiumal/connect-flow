
const bcrypt = require('bcryptjs');
const hash = '$2a$12$7whbjVoDyoketjjr0KF09u5DjQyDl6KLOecetChsvsu.ufAaqS5V2';
const pass1 = 'Admin@123';
const pass2 = 'admin123';
console.log(`Hash: ${hash}`);
console.log(`Admin@123: ${bcrypt.compareSync(pass1, hash)}`);
console.log(`admin123: ${bcrypt.compareSync(pass2, hash)}`);
process.exit();
