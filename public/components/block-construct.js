/// <reference path="../helper/structure.h.ts"/>

import ElementsBuilder from "../library/elements-builder.js";
import { ExtendedComboBox } from "./combobox.js";
import ConstructCombo from "./construct-combo.js";
import InlineConstruct from "./inline-construct.js";

const { div: Div, summary: Summary } = ElementsBuilder.multiple("div", "summary");

class Details extends HTMLDetailsElement {
  /**
   * @param {string} summaryText
   * @param {HTMLElement[]} children
   * @param {boolean} openByDefault
   */
  constructor(summaryText, children = [], openByDefault = false){
    super();
    this.open = openByDefault;
    this.append(new Summary({ innerText: summaryText }), ...children);
  }
};

customElements.define("x-detils", Details, { extends: "details" });

/** @typedef {(`$${number}` | "")[]} Representation */

export default class BlockConstruct extends HTMLDivElement {

  #scopeName;
  #placeholders;
  #constructs;

  /** @param {StructureScopes} scopeName */
  constructor(scopeName){
    super();

    this.type = "if";
    this.condition = "TRUE";
    this.trueBody = [];
    this.falseBody = [];
    this.#scopeName = scopeName;

    this.#placeholders = {
      /** @type {InlineConstruct} */
      condition: new Text("condition"),
      /** @type {(InlineConstruct | BlockConstruct)[]} */
      trueBody: [],
      /** @type {(InlineConstruct | BlockConstruct)[]} */
      falseBody: []
    };

    this.#constructs = {
      trueBody: new ConstructCombo(scopeName),
      falseBody: new ConstructCombo(scopeName)
    };

    this.className = "container v-center pad-500 block-construct";
    this.append(
      new Div({
        className: "container w-fill",
        appendChild: new Details("When", [ this.#placeholders.condition ], true)
      }),
      new Div({
        className: "container w-fill",
        appendChild: new Details("Then", [ this.#constructs.trueBody ], true)
      }),
      new Div({
        className: "container w-fill",
        appendChild: new Details("Otherwise", [ this.#constructs.falseBody ], true)
      })
    );
  }

  async handleChange(Builder){

    const trueBodyParent = this.#constructs.trueBody.parentElement;
    const falseBodyParent = this.#constructs.falseBody.parentElement;

    this.#constructs.trueBody.handleChange(element => {
      if(element instanceof InlineConstruct || element instanceof BlockConstruct){
        this.trueBody.push(element);
      }
      trueBodyParent.insertBefore(element, this.#constructs.trueBody);
    }, Builder.data, Builder);

    this.#constructs.falseBody.handleChange(element => {
      if(element instanceof InlineConstruct || element instanceof BlockConstruct){
        this.falseBody.push(element);
      }
      falseBodyParent.insertBefore(element, this.#constructs.falseBody);
    }, Builder.data, Builder);

  }

  /**
   * @param {{ data: Structure<StructureLiteralsMap, StructureVariablesMap, StructureMethodsMap>; all: <S>(scope: S) => { [type in keyof StructureTypeMap]: { name: string; info: string; scope: S; collection: "literals" | "variables" | "methods" }[] }; methods: <S>(scope: S) => { [type in keyof StructureTypeMap]: { name: string; info: string; scope: S; collection: "methods" }[] }; }} Builder
   */
  async input(Builder){
    const conditionParent = this.#placeholders.condition.parentElement;
    const scope = Builder.data.scopes[this.#scopeName];
    const methodsMap = Builder.methods(this.#scopeName)["Boolean"];
    const conditionCombo = new ExtendedComboBox(
      "methods-list",
      methodsMap.map(({ name, info, scope }) => {
        return { value: name, info, scope }
      })
    );
    conditionParent.replaceChild(conditionCombo, this.#placeholders.condition);
    conditionCombo.focus();
    const methodObject = await conditionCombo.listenForChange();
    const method = Builder.data.scopes[methodObject.scope].methods[methodObject.value];
    const conditionConstruct = new InlineConstruct(methodObject.value, method);
    this.condition = conditionConstruct;
    conditionParent.replaceChild(conditionConstruct, conditionCombo);
    await conditionConstruct.input(Builder, this.#scopeName, scope);
    this.#constructs.trueBody.focus();
  }

  static from(scopeName, condition, trueBody = [], falseBody = []){
    const instance = new BlockConstruct(scopeName);
    const placeholders = instance.#placeholders;
    const constructs = instance.#constructs;
    instance.condition = condition;
    placeholders.condition.parentElement.replaceChild(condition, placeholders.condition);

    for(const element of trueBody){
      if(element instanceof InlineConstruct || element instanceof BlockConstruct){
        instance.trueBody.push(element);
      }
      constructs.trueBody.parentElement.insertBefore(element, constructs.trueBody);
    }
    for(const element of falseBody){
      if(element instanceof InlineConstruct || element instanceof BlockConstruct){
        instance.falseBody.push(element);
      }
      constructs.falseBody.parentElement.insertBefore(element, constructs.falseBody);
    }
    return instance;
  }

};

customElements.define("block-construct", BlockConstruct, { extends: "div" });