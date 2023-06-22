const airtable = require("airtable");

async function addNewUserAccount({ email, password, usageType, plan }) {
  airtable.configure({ apiKey: "keyuraR6wapELA8Vx" });
  const base = airtable.base("app0Z867nAUQu0K2v");
  const table = base("User Account");
  table.create(
    {
      Email: email,
      Password: password,
      UsageType: usageType,
      Plan: plan,
    },
    (err, record) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log(record.getId());
    }
  );
}
//test
// addNewUserAccount({
//   email: "test_123@gmail.com",
//   password: "123456@890",
//   usageType: "Personal",
//   plan: "Standard",
// });

module.exports = addNewUserAccount;
