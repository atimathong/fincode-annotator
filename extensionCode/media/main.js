//@ts-check
// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  const vscode = acquireVsCodeApi();
  //   const addAnnotationToDB = require("../src/airTable/addAnnotationToDB");

  const oldState = vscode.getState() || { colors: [] };
  // @ts-ignore
  let colors = oldState.colors;
  updateColorList(colors);
  // @ts-ignore
  // @ts-ignore
  document.querySelector(".record-ann-button").addEventListener("click", () => {
    vscode.postMessage({ command: "buttonAddRecord" });
  });
  // @ts-ignore
  document.querySelector(".add-ann-button").addEventListener("click", () => {
    vscode.postMessage({ command: "buttonAddAnno" });
    // addAnnotation();
  });

  // Handle messages sent from the extension to the webview
  // @ts-ignore
  //   window.addEventListener("message", (event) => {
  //     const message = event.data; // The json data that the extension sent
  //     switch (message.type) {
  //       case "recordAnnotation": {
  //         addColor();
  //         // recordAnnotationToDB();
  //         break;
  //       }
  //       case "addAnnotation": {
  //         // addAnnotation();
  //         // colors = [];
  //         // updateColorList(colors);
  //         break;
  //       }
  //     }
  //   });

  /**
   * @param {Array<{ value: string }>} colors
   */
  function updateColorList(colors) {
    // @ts-ignore
    const ul = document.querySelector(".color-list");
    ul.textContent = "";
    for (const color of colors) {
      // @ts-ignore
      const li = document.createElement("li");
      li.className = "color-entry";

      // @ts-ignore
      const colorPreview = document.createElement("div");
      colorPreview.className = "color-preview";
      colorPreview.style.backgroundColor = `#${color.value}`;
      colorPreview.addEventListener("click", () => {
        onColorClicked(color.value);
      });
      li.appendChild(colorPreview);

      // @ts-ignore
      const input = document.createElement("input");
      input.className = "color-input";
      input.type = "text";
      input.value = color.value;
      input.addEventListener("change", (e) => {
        const value = e.target.value;
        if (!value) {
          // Treat empty value as delete
          colors.splice(colors.indexOf(color), 1);
        } else {
          color.value = value;
        }
        updateColorList(colors);
      });
      li.appendChild(input);

      ul.appendChild(li);
    }

    // Update the saved state
    vscode.setState({ colors: colors });
  }

  /**
   * @param {string} color
   */
  function onColorClicked(color) {
    vscode.postMessage({ type: "colorSelected", value: color });
  }

  /**
   * @returns string
   */
  function getNewCalicoColor() {
    const colors = ["020202", "f1eeee", "a85b20", "daab70", "efcb99"];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  function addColor() {
    colors.push({ value: getNewCalicoColor() });
    updateColorList(colors);
  }

  function addAnnotation() {}
})();
