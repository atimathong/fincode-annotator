require("dotenv").config();
const airtable = require("airtable");

async function fetchRegulationData(techType) {
  airtable.configure({ apiKey: process.env.AIRTABLE_API_KEY });
  const base = airtable.base(process.env.AIRTABLE_BASE);
  const table = base("Bank Regulation");
  console.log(table);
  let regData = [];
  const records = await table
    .select({
      view: process.env.AIRTABLE_VIEW,
    })
    .all();

  // table
  //   .select({
  //     view: "viwHcuxCRO5129jue",
  //   })
  //   .firstPage((err, records) => {
  //     if (err) {
  //       console.error(err);
  //       return;
  //     }
  //     // console.log(records[0]["fields"]["Key"]);
  //     //all records are in the records array, do something with it
  //     for (let rec of records) {
  //       console.log(rec, rec["fields"]["Tech"]);
  //       console.log(String(rec["fields"]["Tech"]) === techType, techType);
  //       if (String(rec["fields"]["Tech"]) === techType) {
  //         regData.push(rec["fields"]);
  //         console.log("push", regData);
  //       }
  //     }
  //   })
  //   .then(() => {
  //     return regData;
  //   });
  //filter data
  for (let i = 0; i < records.length; i++) {
    if (String(records[i].get("Tech")) === techType) {
      regData.push({
        id: records[i].getId(),
        violation: records[i].get("Violation"),
        regulation: records[i].get("Details"),
        keywords: records[i].get("Key"),
      });
      console.log("push", regData);
    }
  }
  return regData;
}

// fetchRegulationData("Credit-Scoring");

module.exports = fetchRegulationData;
