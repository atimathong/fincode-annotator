const airtable = require("airtable");

async function fetchRegulationData(techType) {
  airtable.configure({ apiKey: "keyuraR6wapELA8Vx" });
  const base = airtable.base("app0Z867nAUQu0K2v");
  const table = base("Bank Regulation");
  console.log(table);
  let regData = [];
  const records = await table
    .select({
      view: "viwHcuxCRO5129jue",
    })
    .all();

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

module.exports = fetchRegulationData;
