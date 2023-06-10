const vscode = require("vscode");

class ReferencesDocument {
  constructor(uri, locations, emitter, content, filePath) {
    this._uri = uri;
    this._locations = locations;
    this._emitter = emitter;
    this._content = content;
    const fileName = filePath.split("/");
    console.log("fileName", fileName);
    this._lines = [
      `⚫ Code Block Name: ${fileName[fileName.length - 1]}`,
      "❇️ Parameter Specified in the Data Source",
    ];
    for (let con of Object.keys(this._content)) {
      this._lines.push(` 🔹 Number of ${con} = ${this._content[con]}`);
    }
    //push example hash code
    this._lines.push(
      "❇️ 3a2f1c8e59d74b6a1bf247f648d6ef87a9472c1385b5e9e5fb0c5d98ec1b07f3"
    );
    this._links = [];
    // this._populate();
  }

  get value() {
    return this._lines.join("\n");
  }

  get links() {
    return this._links;
  }

  async _populate() {
    const groups = [];
    let group = [];
    for (const loc of this._locations) {
      if (
        group.length === 0 ||
        group[0].uri.toString() !== loc.uri.toString()
      ) {
        group = [];
        groups.push(group);
      }
      group.push(loc);
    }

    for (const group of groups) {
      const uri = group[0].uri;
      const ranges = group.map((loc) => loc.range);
      await this._fetchAndFormatLocations(uri, ranges);
      this._emitter.fire(this._uri);
    }
  }

  async _fetchAndFormatLocations(uri, ranges) {
    try {
      const doc = await vscode.workspace.openTextDocument(uri);
      this._lines.push("", uri.toString());
      for (let i = 0; i < ranges.length; i++) {
        const {
          start: { line },
        } = ranges[i];
        this._appendLeading(doc, line, ranges[i - 1]);
        this._appendMatch(doc, line, ranges[i], uri);
        this._appendTrailing(doc, line, ranges[i + 1]);
      }
    } catch (err) {
      this._lines.push(
        "",
        `Failed to load '${uri.toString()}'\n\n${String(err)}`,
        ""
      );
    }
  }

  _appendLeading(doc, line, previous) {
    let from = Math.max(0, line - 3, (previous && previous.end.line) || 0);
    while (++from < line) {
      const text = doc.lineAt(from).text;
      this._lines.push(`  ${from + 1}` + (text && `  ${text}`));
    }
  }

  _appendMatch(doc, line, match, target) {
    const text = doc.lineAt(line).text;
    const preamble = `  ${line + 1}: `;
    const len = this._lines.push(preamble + text);
    const linkRange = new vscode.Range(
      len - 1,
      preamble.length + match.start.character,
      len - 1,
      preamble.length + match.end.character
    );
    const linkTarget = target.with({ fragment: String(1 + match.start.line) });
    this._links.push(new vscode.DocumentLink(linkRange, linkTarget));
  }

  _appendTrailing(doc, line, next) {
    const to = Math.min(doc.lineCount, line + 3);
    if (next && next.start.line - to <= 2) {
      return;
    }
    while (++line < to) {
      const text = doc.lineAt(line).text;
      this._lines.push(`  ${line + 1}` + (text && `  ${text}`));
    }
    if (next) {
      this._lines.push(`  ...`);
    }
  }
}

module.exports = {
  ReferencesDocument,
};
