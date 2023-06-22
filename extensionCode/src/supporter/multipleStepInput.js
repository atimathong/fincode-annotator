"use strict";
const fetchUserAccount = require("../airTable/fetchUserAccount");
const addNewUserAccount = require("../airTable/addNewUserAccount");
const { hashPassword, comparePassword } = require("../auth/passwordEncryption");

Object.defineProperty(exports, "__esModule", { value: true });
exports.multiStepInput = void 0;
const vscode = require("vscode");
/**
 * A multi-step input using window.createQuickPick() and window.createInputBox().
 *
 * This first part uses the helper class `MultiStepInput` that wraps the API for the multi-step case.
 */
async function multiStepInput(context) {
  class MyButton {
    constructor(iconPath, tooltip) {
      this.iconPath = iconPath;
      this.tooltip = tooltip;
    }
  }
  const createResourceGroupButton = new MyButton(
    {
      dark: vscode.Uri.file(context.asAbsolutePath("media/dark/add.svg")),
      light: vscode.Uri.file(context.asAbsolutePath("media/light/add.svg")),
    },
    "Create Resource Group"
  );
  const authOptionGroups = [
    "Sign in with Fincode",
    "Sign in with Google",
    "Create new account",
  ].map((label) => ({ label }));
  async function collectInputs() {
    const state = {};
    await MultiStepInput.run((input) => pickAuthOption(input, state));
    return state;
  }
  const title = "Create New Account";
  async function pickAuthOption(input, state) {
    const pick = await input.showQuickPick({
      title,
      step: 1,
      totalSteps: 5,
      placeholder: "Pick your signin option",
      items: authOptionGroups,
      activeItem:
        typeof state.resourceGroup !== "string"
          ? state.resourceGroup
          : undefined,
      buttons: [createResourceGroupButton],
      shouldResume: shouldResume,
    });
    state.resourceGroup = pick;
    //1. For create new account only!!!
    return (input) => inputName(input, state);
    //2. Todo: Sign in with Google
    //3. Todo: Sign in with Fincode
  }
  // async function inputResourceGroupName(input, state) {
  //   state.resourceGroup = await input.showInputBox({
  //     title,
  //     step: 2,
  //     totalSteps: 5,
  //     value: typeof state.resourceGroup === "string" ? state.resourceGroup : "",
  //     prompt: "Choose a unique name for the resource group",
  //     validate: validateNameIsUnique,
  //     shouldResume: shouldResume,
  //   });
  //   return (input) => inputName(input, state);
  // }
  async function inputName(input, state) {
    //For create new account only!!!
    // const additionalSteps = typeof state.resourceGroup === "string" ? 1 : 0;
    // TODO: Remember current value when navigating back.
    state.email = await input.showInputBox({
      title,
      step: 2, //+ additionalSteps,
      totalSteps: 5, //+ additionalSteps,
      value: state.email || "",
      prompt: "Please enter your email address",
      validate: validateNameIsUnique,
      shouldResume: shouldResume,
    });

    console.log("check email", state.email);
    return (input) => inputPassword(input, state);
    // return (input) => pickUsageType(input, state);
  }
  let initialPassword = "";
  async function inputPassword(input, state) {
    // const additionalSteps = typeof state.resourceGroup === "string" ? 1 : 0;
    // TODO: Remember current value when navigating back.
    state.pw = await input.showInputBox({
      title,
      step: 3, //+ additionalSteps,
      totalSteps: 5, //+ additionalSteps,
      value: state.pw || "",
      prompt: "Please enter your password",
      validate: validateNameIsUnique,
      shouldResume: shouldResume,
      password: true,
    });
    // return (input) => inputName(input, state);
    return (input) => inputConfirmPassword(input, state);
  }
  async function inputConfirmPassword(input, state) {
    // const additionalSteps = typeof state.resourceGroup === "string" ? 1 : 0;
    // TODO: Remember current value when navigating back.
    initialPassword = state.pw;
    state.cfPW = await input.showInputBox({
      title,
      step: 4, //+ additionalSteps,
      totalSteps: 5, //+ additionalSteps,
      value: state.cfPW || "",
      prompt: "Please confirm your password",
      validate: validateNameIsUnique, //change to compare with initial input
      shouldResume: shouldResume,
      password: true,
    });
    // return (input) => inputName(input, state);
    return (input) => pickUsageType(input, state);
  }
  async function inputOrganisation(input, state) {
    // const additionalSteps = typeof state.resourceGroup === "string" ? 1 : 0;
    // TODO: Remember current value when navigating back.
    state.name = await input.showInputBox({
      title,
      step: 6,
      totalSteps: 6,
      value: state.name || "",
      prompt: "Please enter your organisation name",
      validate: validateNameIsUnique,
      shouldResume: shouldResume,
    });

    //end of registration
  }
  async function pickUsageType(input, state) {
    // const additionalSteps = typeof state.resourceGroup === "string" ? 1 : 0;
    // console.log(additionalSteps);
    const usageType = await getUsageType(
      state.resourceGroup,
      undefined /* TODO: token */
    );
    // TODO: Remember currently active item when navigating back.
    state.usageType = await input.showQuickPick({
      title,
      step: 5, // additionalSteps,
      totalSteps: 5, // + additionalSteps,
      placeholder: "Select a type of usage",
      items: usageType,
      activeItem: state.usageType,
      shouldResume: shouldResume,
    });

    if (state.usageType["label"] === "Organisation") {
      return (input) => inputOrganisation(input, state);
    }
  }
  function shouldResume() {
    // Could show a notification with the option to resume.
    return new Promise((resolve, reject) => {
      // noop
    });
  }
  async function validateNameIsUnique(name, type) {
    // ...validate...
    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (type === "email") {
      //if not in email format => show error msg
      const emailRegEx = new RegExp(
        /^[A-Za-z0-9_!#$%&'*+\/=?`{|}~^.-]+@[A-Za-z0-9.-]+$/,
        "gm"
      );
      if (!emailRegEx.test(name)) {
        return "Your input must be in a valid standard email format.";
      }
      //Check input against user database
      //call airtable "User" database
      let userData = await fetchUserAccount("validateNewAccount");
      console.log("user", userData);
      for (let user of userData) {
        if (user["email"] === name) {
          return "Your account already exists! Please go back to previous step or press 'esc'.";
        }
      }
    } else if (type === "password") {
      const pwRegEx = new RegExp(
        /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,15}$/
      );
      if (!pwRegEx.test(name)) {
        return "Password must have 8 to 15 characters which contain at least one numeric digit and a special character!";
      }

      if (initialPassword !== "") {
        if (name !== initialPassword) {
          return "Your confirmed password doesn't match the previous input.";
        }
      }
    }
    return undefined;
  }

  async function getUsageType() {
    // ...retrieve...
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return ["Personal", "Organisation"].map((label) => ({ label }));
  }
  const state = await collectInputs();
  console.log(state);

  //add new user
  if (state.resourceGroup["label"] === "Create new account") {
    let newUser = {
      email: state.email,
      password: await hashPassword(state.pw),
      usageType: state.usageType["label"],
      plan: "Standard",
    };
    await addNewUserAccount(newUser).then(() => {
      vscode.window.showInformationMessage("Successfully created new account");
    });
  }
}
exports.multiStepInput = { multiStepInput };
// -------------------------------------------------------
// Helper code that wraps the API for the multi-step case.
// -------------------------------------------------------
class InputFlowAction {}
InputFlowAction.back = new InputFlowAction();
InputFlowAction.cancel = new InputFlowAction();
InputFlowAction.resume = new InputFlowAction();
class MultiStepInput {
  constructor() {
    this.steps = [];
  }
  static async run(start) {
    const input = new MultiStepInput();
    return input.stepThrough(start);
  }
  async stepThrough(start) {
    let step = start;
    while (step) {
      this.steps.push(step);
      if (this.current) {
        this.current.enabled = false;
        this.current.busy = true;
      }
      try {
        step = await step(this);
      } catch (err) {
        if (err === InputFlowAction.back) {
          this.steps.pop();
          step = this.steps.pop();
        } else if (err === InputFlowAction.resume) {
          step = this.steps.pop();
        } else if (err === InputFlowAction.cancel) {
          step = undefined;
        } else {
          throw err;
        }
      }
    }
    if (this.current) {
      this.current.dispose();
    }
  }
  async showQuickPick({
    title,
    step,
    totalSteps,
    items,
    activeItem,
    ignoreFocusOut,
    placeholder,
    buttons,
    shouldResume,
  }) {
    const disposables = [];
    try {
      return await new Promise((resolve, reject) => {
        const input = vscode.window.createQuickPick();
        input.title = title;
        input.step = step;
        input.totalSteps = totalSteps;
        input.ignoreFocusOut = ignoreFocusOut ? false : true;
        input.placeholder = placeholder;
        input.items = items;
        if (activeItem) {
          input.activeItems = [activeItem];
        }
        input.buttons = [
          ...(this.steps.length > 1 ? [vscode.QuickInputButtons.Back] : []),
          ...(buttons || []),
        ];
        disposables.push(
          input.onDidTriggerButton((item) => {
            if (item === vscode.QuickInputButtons.Back) {
              reject(InputFlowAction.back);
            } else {
              resolve(item);
            }
          }),
          input.onDidChangeSelection((items) => resolve(items[0])),
          input.onDidHide(() => {
            (async () => {
              reject(
                shouldResume && (await shouldResume())
                  ? InputFlowAction.resume
                  : InputFlowAction.cancel
              );
            })().catch(reject);
          })
        );
        if (this.current) {
          this.current.dispose();
        }
        this.current = input;
        this.current.show();
      });
    } finally {
      disposables.forEach((d) => d.dispose());
    }
  }
  async showInputBox({
    title,
    step,
    totalSteps,
    value,
    prompt,
    validate,
    buttons,
    ignoreFocusOut,
    placeholder,
    shouldResume,
    password,
  }) {
    const disposables = [];
    try {
      return await new Promise((resolve, reject) => {
        const input = vscode.window.createInputBox();
        input.title = title;
        input.step = step;
        input.totalSteps = totalSteps;
        input.value = value || "";
        input.prompt = prompt;
        input.ignoreFocusOut = ignoreFocusOut ? false : true;
        input.placeholder = placeholder;
        input.password = password ? true : false;
        input.buttons = [
          ...(this.steps.length > 1 ? [vscode.QuickInputButtons.Back] : []),
          ...(buttons || []),
        ];
        let purpose = input.prompt.includes("email")
          ? "email"
          : input.prompt.includes("password")
          ? "password"
          : "";
        let validating = validate("", purpose);
        disposables.push(
          input.onDidTriggerButton((item) => {
            if (item === vscode.QuickInputButtons.Back) {
              reject(InputFlowAction.back);
            } else {
              resolve(item);
            }
          }),
          input.onDidAccept(async () => {
            const value = input.value;
            input.enabled = false;
            input.busy = true;
            if (!(await validate(value, purpose))) {
              resolve(value);
            }
            input.enabled = true;
            input.busy = false;
          }),
          input.onDidChangeValue(async (text) => {
            const current = validate(text, purpose);
            validating = current;
            const validationMessage = await current;
            if (current === validating) {
              input.validationMessage = validationMessage;
            }
          }),
          input.onDidHide(() => {
            (async () => {
              reject(
                shouldResume && (await shouldResume())
                  ? InputFlowAction.resume
                  : InputFlowAction.cancel
              );
            })().catch(reject);
          })
        );
        if (this.current) {
          this.current.dispose();
        }
        this.current = input;
        this.current.show();
      });
    } finally {
      disposables.forEach((d) => d.dispose());
    }
  }
}
//# sourceMappingURL=multiStepInput.js.map
