function matchVarToKeywords(regData, varData) {
  // varData = {
  //     variable: variableName,
  //     line: position.line,
  //     character: position.character,
  //   };
  let addRegData = {};
  try {
    for (let reg of regData) {
      reg["keywords"].forEach((kw) => {
        let lowVari = varData["variable"].toLowerCase();
        if (kw === lowVari || lowVari.includes(kw)) {
          console.log(kw, lowVari);
          Object.assign(addRegData, reg);
        }
      });
    }
  } catch (error) {
    console.log(error);
  }

  if (Object.keys(addRegData).length === 0) {
    return null;
  }
  return addRegData;

  //return [] if find no match keyword
  //return regulation data if find matched keyword
}

module.exports = { matchVarToKeywords };
