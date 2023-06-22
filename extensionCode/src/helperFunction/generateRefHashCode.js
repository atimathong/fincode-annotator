const { createHash } = require("crypto");

function getRefHashCode(content) {
  return createHash("sha256").update(content).digest("hex");
}

module.exports = { getRefHashCode };
