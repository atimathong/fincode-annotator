const bcrypt = require("bcrypt");

async function hashPassword(plaintextPassword) {
  const hash = await bcrypt.hash(plaintextPassword, 10);
  // return hash to be stored in the database
//   console.log(hash);
  return hash;
}

// compare password
async function comparePassword(plaintextPassword, hash) {
  const result = await bcrypt.compare(plaintextPassword, hash);
//   console.log("res", result);
  return result;
}

// hashPassword("female#12130");

module.exports = { hashPassword, comparePassword };
