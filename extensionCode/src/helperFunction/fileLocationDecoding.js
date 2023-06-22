const vscode = require("vscode");

function decodeLocation(uri) {
  let _a = JSON.parse(uri.query),
    target = _a[0],
    line = _a[1],
    character = _a[2];
  // console.log("decode", uri.query);
  // console.log(target, line, character);
  return [vscode.Uri.parse(target), new vscode.Position(line, character)];
}

module.exports = { decodeLocation };
