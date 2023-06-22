"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
// Object.defineProperty(exports, "__esModule", { value: true });
// exports.decodeLocation = exports.encodeLocation = void 0;
const vscode = require("vscode");
const { ReferencesDocument } = require("./referenceDocument.js");
let Provider = /** @class */ (function () {
  function Provider(report) {
    let _this = this;
    this._report = report;
    this._onDidChange = new vscode.EventEmitter();
    this._documents = new Map();
    this._editorDecoration = vscode.window.createTextEditorDecorationType({
      textDecoration: "underline",
    });
    // Listen to the `closeTextDocument`-event which means we must
    // clear the corresponding model object - `ReferencesDocument`
    this._subscriptions = vscode.workspace.onDidCloseTextDocument(function (
      doc
    ) {
      return _this._documents.delete(doc.uri.toString());
    });
    this._annotatedData = "";
  }
  Provider.prototype.dispose = function () {
    this._subscriptions.dispose();
    this._documents.clear();
    this._editorDecoration.dispose();
    this._onDidChange.dispose();
  };
  Object.defineProperty(Provider.prototype, "onDidChange", {
    // Expose an event to signal changes of _virtual_ documents
    // to the editor
    get: function () {
      return this._onDidChange.event;
    },
    enumerable: false,
    configurable: true,
  });
  // Provider method that takes an uri of the `references`-scheme and
  // resolves its content by (1) running the reference search command
  // and (2) formatting the results
  Provider.prototype.provideTextDocumentContent = function (uri) {
    let _this = this;
    // already loaded?
    let document = this._documents.get(uri.toString());
    if (document) {
      return document.value;
    }
    // Decode target-uri and target-position from the provided uri and execute the
    // `reference provider` command (https://code.visualstudio.com/api/references/commands).
    // From the result create a references document which is in charge of loading,
    // printing, and formatting references
    let _a = decodeLocation(uri),
      target = _a[0],
      pos = _a[1];
    // console.log("pos", target, pos);
    return vscode.commands
      .executeCommand("vscode.executeReferenceProvider", target, pos)
      .then(function (locations) {
        locations = locations || [];
        // sort by locations and shuffle to begin from target resource
        let idx = 0;
        locations.sort(Provider._compareLocations).find(function (loc, i) {
          return (
            loc.uri.toString() === target.toString() && !!(idx = i) && true
          );
        });
        locations.push.apply(locations, locations.splice(0, idx));

        // create document and return its early state
        let document = new ReferencesDocument(
          uri,
          locations,
          _this._onDidChange,
          _this._report
        );
        _this._documents.set(uri.toString(), document);
        console.log("docs", document.value);
        _this._annotatedData = document.value;
        return document.value;
      });
  };

  Provider._compareLocations = function (a, b) {
    if (a.uri.toString() < b.uri.toString()) {
      return -1;
    } else if (a.uri.toString() > b.uri.toString()) {
      return 1;
    } else {
      return a.range.start.compareTo(b.range.start);
    }
  };
  Provider.prototype.provideDocumentLinks = function (document, token) {
    // While building the virtual document we have already created the links.
    // Those are composed from the range inside the document and a target uri
    // to which they point
    let doc = this._documents.get(document.uri.toString());
    if (doc) {
      return doc.links;
    }
  };
  Provider.scheme = "references";
  return Provider;
})();

// exports.Provider = Provider;

let seq = 0;
function encodeLocation(uri, pos) {
  let query = JSON.stringify([uri.toString(), pos.line, pos.character]);
  console.log("query", query);
  return vscode.Uri.parse(
    ""
      .concat(Provider.scheme, ":References.locations?")
      .concat(query, "#")
      .concat(seq++)
  );
}
// exports.encodeLocation = encodeLocation;

function decodeLocation(uri) {
  let _a = JSON.parse(uri.query),
    target = _a[0],
    line = _a[1],
    character = _a[2];
  // console.log("decode", uri.query);
  // console.log(target, line, character);
  return [vscode.Uri.parse(target), new vscode.Position(line, character)];
}
// exports.decodeLocation = decodeLocation;

module.exports = { Provider, decodeLocation, encodeLocation };
