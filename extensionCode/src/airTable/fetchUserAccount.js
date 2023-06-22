const airtable = require("airtable");

async function fetchUserAccount(purpose) {
  airtable.configure({ apiKey: "keyuraR6wapELA8Vx" });
  const base = airtable.base("app0Z867nAUQu0K2v");
  const table = base("User Account");
  console.log(table);
  let userData = [];
  const records = await table
    .select({
      view: "viwPFh3XfHL7tETJ3",
    })
    .all();
  //   console.log(records);

  for (let i = 0; i < records.length; i++) {
    if (purpose === "validateNewAccount") {
      userData.push({
        email: records[i].get("Email"),
      });
    } else if (purpose === "validateSignIn")
      userData.push({
        email: records[i].get("Email"),
        password: records[i].get("Password"),
        usageType: records[i].get("UsageType"),
        plan: records[i].get("Plan"),
      });
    console.log("push", userData);
  }

  return userData;
}
module.exports = fetchUserAccount;

// fetchUserAccount("validateSignIn");
