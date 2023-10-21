/// <reference path="../helper/structure.h.ts"/>

import BlockConstruct from "./block-construct.js";
import ComboBox, { ExtendedComboBox } from "./combobox.js";
import InlineConstruct from "./inline-construct.js";

/** @template {StructureScopes} T */
export default class ConstructCombo extends ExtendedComboBox {
  #scopeName;
  /** @param {T} scopeName */
  constructor(scopeName){
    super("constructs-list", [
      { value: "if", info: "Conditional" },
      { value: "invoke", info: "Expression" }
    ]);
    this.#scopeName = scopeName;
    this.placeholder = "Add construct";
  }
  /**
   * @param {Structure<StructureLiteralsMap, StructureVariablesMap, StructureMethodsMap>} BuilderData
  */
  async handleChange(insertElement = async element => {}, BuilderData, Builder, shouldRemove = false){
    const scope = BuilderData.scopes[this.#scopeName];
    /** @type {{ value: "if" | "invoke" }} */
    this.addEventListener("change", async function(){
      const constructName = this.value;
      this.value = "";
      if(constructName === "invoke"){
        if(shouldRemove){
          this.remove();
        }
        // this.disabled = true;
        const methodsCombo = new ExtendedComboBox("methods-list", [
          ...Object.entries(scope.methods),
          ...Object.entries(BuilderData.scopes.global.methods),
        ]
          // .filter(entry => entry[1].returns === "Void")
          .map(([ name, method ]) => ({ value: name, info: method.info }))
        );
        methodsCombo.classList.add("container", "row");
        methodsCombo.placeholder = "Choose an action";
        await insertElement(methodsCombo);
        methodsCombo.focus();

        await methodsCombo.listenForChange();

        // methodsCombo.disabled = true;
        /** @type {keyof (BuilderData["scopes"]["global"] & scope)["methods"]} */
        const methodName = methodsCombo.value;
        const { methods } = methodName in scope.methods ? scope : BuilderData.scopes.global;
        const method = methods[methodName];

        const inlineConstruct = new InlineConstruct(methodName, method);
        await insertElement(inlineConstruct);
        methodsCombo.remove();
        await inlineConstruct.input(Builder, this.#scopeName, scope);
      }
      else if(constructName === "if") {
        if(shouldRemove){
          this.remove();
        }
        // this.disabled = true;
        const blockConstruct = new BlockConstruct(this.#scopeName);
        blockConstruct.handleChange(Builder);
        await insertElement(blockConstruct);
        await blockConstruct.input(Builder);
      }
    });
  }
};

customElements.define("construct-combo", ConstructCombo, { extends: "div" });