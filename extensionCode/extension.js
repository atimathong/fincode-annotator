// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const fetchRegulationData = require("./src/airTable/fetchRegulationData.js");
const {
  matchVarToKeywords,
} = require("./src/helperFunction/matchVarToKeywords.js");
const { countOccurrence } = require("./src/helperFunction/countOccurrence.js");
const {
  Provider,
  encodeLocation,
} = require("./src/supporter/contentProvider.js");
const { multiStepInput } = require("./src/supporter/multipleStepInput.js");
const AnnotateCodeWebViewProvider = require("./src/supporter/webViewProvider.js");
const {
  writeAnnotationReport,
} = require("./src/helperFunction/writeAnnotationReport.js");

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "fincode-annotator" is now active!'
  );
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "fincode-annotator.helloWorld",
    function () {
      // The code you place here will be executed every time your command is executed

      // Display a message box to the user
      vscode.window.showInformationMessage("Hello World from Code Annotator!");
    }
  );

  let getCodeBlock = vscode.commands.registerCommand(
    "fincode-annotator.annotate",
    async function () {
      // Get regulation data
      const techType = await vscode.window.showQuickPick([
        "Credit-Scoring",
        "Peer-to-Peer Lending",
      ]);
      console.log(techType);

      // // Display a message box to the user
      if (techType === "Credit-Scoring") {
        vscode.window.showInformationMessage(
          "Credit scoring regulation applied"
        );
      } else {
        vscode.window.showInformationMessage("Peer-to-peer regulation applied");
      }
      const regData = await fetchRegulationData(techType);
      console.log("reg", regData);
      // Get the active text editor
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const document = editor.document;
        const text = document.getText();
        try {
          const variableRegex = /\b([a-zA-Z_]\w*)\b/g;
          let variableLocations = [];
          let location = [];
          let ranges = [];
          let match;
          let decorations_normal = [];
          let decorations_violate = [];
          let addRegData = {};
          while ((match = variableRegex.exec(text))) {
            const variableName = match[1];
            const position = document.positionAt(match.index);
            location = {
              variable: variableName,
              line: position.line, // Convert zero-based index to one-based line number
              character: position.character,
            };
            variableLocations.push(location);

            const positionStart = document.positionAt(match.index);
            const positionEnd = document.positionAt(
              match.index + match[0].length
            );
            //mapping with Air Table data: selective decoration
            addRegData = matchVarToKeywords(regData, location);
            // console.log("add", addRegData);
            if (addRegData !== null) {
              const decoration = {
                range: new vscode.Range(positionStart, positionEnd),
                hoverMessage: addRegData["regulation"], // Optional hover message for the decoration
              };
              if (addRegData["violation"] === "true") {
                decorations_violate.push(decoration);
              } else {
                decorations_normal.push(decoration);
              }
              ranges.push(new vscode.Range(positionStart, positionEnd));
            }
          }
          // Apply the decorations to the active text editor
          editor.setDecorations(
            vscode.window.createTextEditorDecorationType({
              backgroundColor: "#E9F3CD",
            }),
            decorations_normal
          );
          editor.setDecorations(
            vscode.window.createTextEditorDecorationType({
              backgroundColor: "#F7CCC2",
            }),
            decorations_violate
          );
          // detect variable location in the text file
          if (variableLocations.length > 0) {
            // Output the variable locations
            variableLocations.forEach((location) => {
              console.log(
                `Variable '${location.variable}' found at line ${location.line}, character ${location.character}.`
              );
            });
          } else {
            console.log("No variables found in the code.");
          }
        } catch (error) {
          console.log(error);
        }
      }
    }
  );
  let contentObj = {};
  let provider;
  let providerRegistrations;
  const commandRegistration = vscode.commands.registerTextEditorCommand(
    "fincode-annotator.printReferences",
    async (editor) => {
      // Get regulation data
      const techType = await vscode.window.showQuickPick([
        "Credit-Scoring",
        "Peer-to-Peer Lending",
      ]);
      console.log(techType);
      // // Display a message box to the user
      if (techType === "Credit-Scoring") {
        vscode.window.showInformationMessage(
          "Credit scoring regulation applied"
        );
      } else {
        vscode.window.showInformationMessage("Peer-to-peer regulation applied");
      }

      //GET VAR ARRAYS
      // const editor = vscode.window.activeTextEditor;

      const document = editor.document;
      const text = document.getText();
      const variableRegex = /\b([a-zA-Z_]\w*)\b/g;
      let variableItems = [];
      let match;
      while ((match = variableRegex.exec(text))) {
        const variableName = match[1];
        variableItems.push(variableName);
      }

      //call regulation data
      const regData = await fetchRegulationData(techType);
      // console.log("reg", regData);

      //COUNT OCCURRENCE
      contentObj = countOccurrence(regData, variableItems);

      //uri
      const uri = encodeLocation(editor.document.uri, editor.selection.active);

      //Prepare the report
      let { report, refNum } = writeAnnotationReport(
        text,
        techType,
        uri,
        contentObj
      );

      //CONTENT PROVIDER
      provider = new Provider(report);
      // register content provider for scheme `references`
      // register document link provider for scheme `references`
      providerRegistrations = vscode.Disposable.from(
        vscode.workspace.registerTextDocumentContentProvider(
          Provider.scheme,
          provider
        ),
        vscode.languages.registerDocumentLinkProvider(
          { scheme: Provider.scheme },
          provider
        )
      );
      //test webview
      const activeEditor = vscode.window.activeTextEditor;
      let lastLine;
      let nextLinePosition = new vscode.Position(0, 0);

      //only work when there is an active editor
      if (activeEditor) {
        // Get the last line number: Next line
        lastLine = activeEditor.document.lineCount - 1;
        // Get the position of the last line
        nextLinePosition = new vscode.Position(lastLine + 1, 0);
        // Output the last line position
        console.log(`Last line position: ${JSON.stringify(nextLinePosition)}`);

        const webViewProvider = new AnnotateCodeWebViewProvider(
          context.extensionUri,
          report,
          refNum,
          uri,
          nextLinePosition
        );
        vscode.window.registerWebviewViewProvider(
          "fincode-annotator.showweb",
          webViewProvider
        );

        //editor.selection.active.line = line no. of parameter
        //editor.selection.active.character = character position of parameter
        return vscode.workspace.openTextDocument(uri).then((doc) => {
          vscode.window.showTextDocument(
            doc,
            editor.viewColumn ? editor.viewColumn + 1 : 1
          );
        });
      } else {
        vscode.window.showInformationMessage(
          "Please open up your code file first!"
        );
      }
    }
  );

  //signin
  let signin = vscode.commands.registerCommand(
    "fincode-annotator.signin",
    async () => {
      try {
        multiStepInput
          .multiStepInput(context)
          .then(() =>
            vscode.commands.executeCommand(
              "setContext",
              "myExtension.doneSignin",
              true
            )
          );
      } catch (error) {
        console.log(error);
      }
    }
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(getCodeBlock);
  context.subscriptions.push(
    provider,
    commandRegistration,
    providerRegistrations
  );
  context.subscriptions.push(signin);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
