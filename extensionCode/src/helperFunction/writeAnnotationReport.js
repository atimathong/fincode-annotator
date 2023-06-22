const { getRefHashCode } = require("./generateRefHashCode");
const { decodeLocation } = require("./fileLocationDecoding");
function writeAnnotationReport(codeBlockText, standard, codeFilePath, content) {
  let codeBlockPath = decodeLocation(codeFilePath)[0].toString().split("/");
  let codeBlockName = codeBlockPath[codeBlockPath.length - 1];
  let toPrintAnnotation =
    "# ❇️ Standard Compliance Report" +
    `\n# 🔹 Standard: ${standard}` +
    `\n# 🔹 Code Block Name: ${codeBlockName}` +
    `\n# 🔹 Count of standard evidence in the code block`;
  for (let ann of Object.keys(content)) {
    toPrintAnnotation += `\n#     ${ann}: ${content[ann]}`;
  }
  toPrintAnnotation += `\n# 🔹 Count of absent standard evidence in the code block: `;
  toPrintAnnotation += `\n# 🔹 Count of standard violation in the code block: `;

  let contentForHash =
    `Code Block: \n${codeBlockText}` + `\n${toPrintAnnotation}`;
  let hashRefCode = getRefHashCode(contentForHash);

  let finalPrintAnno =
    toPrintAnnotation + `\n# 🔹 Reference Number: ${hashRefCode}`;

  return { report: finalPrintAnno, refNum: hashRefCode };
}

module.exports = { writeAnnotationReport };
