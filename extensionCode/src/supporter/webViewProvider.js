"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const addAnnotationToDB = require("../airTable/addAnnotationToDB.js");
const { decodeLocation } = require("../helperFunction/fileLocationDecoding.js");

const AnnotateCodeWebViewProvider = /** @class */ (function () {
  function AnnotateCodeWebViewProvider(
    _extensionUri,
    report,
    refNum,
    filePath,
    annPosition
  ) {
    this._extensionUri = _extensionUri;
    this._report = report;
    this._refNum = refNum;
    this._filePath = filePath;
    this._annPosition = annPosition;
  }
  AnnotateCodeWebViewProvider.prototype.resolveWebviewView = function (
    webviewView,
    context,
    _token
  ) {
    this._view = webviewView;
    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };
    //insert HTML into the webview
    // console.log("track", this._content);
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    let codeBlockPath = decodeLocation(this._filePath)[0].toString().split("/");
    let codeBlockName = codeBlockPath[codeBlockPath.length - 1];
    let annPosition = this._annPosition;
    let refNumber = this._refNum;
    //TODO: parse annoContent to the readable format
    //annoContent => must be pre-classfied into comply & violate
    let toPrintAnnotation = this._report;

    webviewView.webview.onDidReceiveMessage(async function (data) {
      let _a;
      if (data.command === "buttonAddRecord") {
        console.log("buttonAddRecord");
        await addAnnotationToDB({
          refNum: refNumber,
          codeBlockName: codeBlockName,
          codeAnnotation: toPrintAnnotation,
          userID: "abc", //TODO: after authentication is done
        });
      } else if (data.command === "buttonAddAnno") {
        console.log("buttonAddAnno");
        const activeEditor = vscode.window.activeTextEditor;
        let cursorLine = activeEditor.selection.active.line;
        let cursorChar = activeEditor.selection.active.character;
        let cursorPosition = new vscode.Position(cursorLine, cursorChar);
        console.log(cursorPosition.line);
        let insertPosition =
          annPosition.line < cursorPosition.line ? cursorPosition : annPosition;
        (_a = vscode.window.activeTextEditor) === null || _a === void 0
          ? void 0
          : _a.insertSnippet(
              new vscode.SnippetString(toPrintAnnotation),
              insertPosition
            );
      }

      //to delete
      // switch (data.type) {
      //   case "colorSelected": {
      //     (_a = vscode.window.activeTextEditor) === null || _a === void 0
      //       ? void 0
      //       : _a.insertSnippet(
      //           new vscode.SnippetString("#".concat(data.value))
      //         );
      //     break;
      //   }
      // }
    });
  };
  AnnotateCodeWebViewProvider.prototype.addColor = function () {
    let _a, _b;
    if (this._view) {
      (_b = (_a = this._view).show) === null || _b === void 0
        ? void 0
        : _b.call(_a, true); // `show` is not implemented in 1.49 but is for 1.50 insiders
      this._view.webview.postMessage({ type: "addColor" });
    }
  };
  AnnotateCodeWebViewProvider.prototype.clearColors = function () {
    if (this._view) {
      this._view.webview.postMessage({ type: "clearColors" });
    }
  };
  AnnotateCodeWebViewProvider.prototype._getHtmlForWebview = function (
    webview
  ) {
    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
    let scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "main.js")
    );
    // Do the same for the stylesheet.
    let styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    let styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );
    let styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "main.css")
    );
    // Use a nonce to only allow a specific script to be run.
    let nonce = getNonce();
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <link href="${styleResetUri}" rel="stylesheet">
        <link href="${styleVSCodeUri}" rel="stylesheet">
        <link href="${styleMainUri}" rel="stylesheet">

        <title>Fincode Annotation</title>
    </head>
    <body>
        <ul class="color-list">
		</ul>
        <button class="add-ann-button">Add Annotation</button>
        <div></div>
        <button class="record-ann-button">Record Annotation to database</button>
        <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>`;
  };
  return AnnotateCodeWebViewProvider;
})();
function getNonce() {
  let text = "";
  let possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

module.exports = AnnotateCodeWebViewProvider;

// <div id="passAnnotationData" anndetail=${
//     this._content
//   } codeblockname=${"code.py"} hashref=${"aaaaa"}></div>

{
  /* <article id="pass-data" data-code-name="code.py" data-ref-number="12314" data-parent=${JSON.stringify(
    this._content
  )}></article> */
}
