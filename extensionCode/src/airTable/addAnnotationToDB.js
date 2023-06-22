const airtable = require("airtable");

async function addAnnotationToDB({
  refNum,
  codeBlockName,
  codeAnnotation,
  userID,
}) {
  airtable.configure({ apiKey: "keyuraR6wapELA8Vx" });
  const base = airtable.base("app0Z867nAUQu0K2v");
  const table = base("Code Annotation");
  //   let rearrCodeAnn = {
  //     existInDataSource: JSON.parse(JSON.stringify(codeAnnotation)),
  //   };

  const dateObject = new Date();
  let date = dateObject.toUTCString().slice(5, 16);

  console.log("check", refNum, codeBlockName, codeAnnotation, date);

  table.create(
    {
      RefNumber: refNum,
      CodeBlockName: codeBlockName,
      CodeAnnotation: codeAnnotation,
      Date: date,
      UserID: userID,
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
// addAnnotationToDB({
//   refNum: "ccdgrfhygthfvdf",
//   codeBlockName: "code.py",
//   codeAnnotation: {
//     perform_creditscoring: 1,
//     age: 2,
//     loan: 2,
//     delinquency_record: 2,
//   },
//   userID: "abc",
// });

module.exports = addAnnotationToDB;
