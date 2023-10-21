import ElementsBuilder from "../library/elements-builder.js";
import ComboBox, { ExtendedComboBox } from "./combobox.js";

/** @typedef {import("../scripts/structure.js")["default"]} Structure */

/** @typedef {import("../scripts/structure.js")["default"]["types"]} StructureTypeMap */
/** @typedef {import("../scripts/structure.js")["default"]["scopes"]} StructureScopeMap */

/**
 * @template {keyof StructureScopeMap} T
 * @typedef {StructureScopeMap[T]} StructureScope */
/**
 * @template {keyof StructureScopeMap} T
 * @template {keyof (StructureScope<"global"> & StructureScope<T>)["methods"]} M
 * @typedef {(StructureScope<"global"> & StructureScope<T>)["methods"][M]} StructureScopeMethod */

/** @typedef {{ info: string; templates: { [name: string]: (keyof StructureTypeMap)[] }; params: (keyof StructureTypeMap)[]; returns: keyof StructureTypeMap; representation: (`$${number}` | "")[]; }} StructureMethod */

/** @typedef {(`$${number}` | "")[]} Representation */

const { code: Code } = ElementsBuilder.multiple("div", "code");

/** @template {StructureMethod} T */
export default class InlineConstruct extends HTMLDivElement {

  type = "method";
  #method;

  /** @type {Map<number, HTMLElement[]>} */
  #argsMap = new Map();
  args = [];
  /** @type {Map<number, Text[]>} */
  #paramsMap = new Map();
  #comboboxes;

  /** @param {T} method */
  constructor(methodName, method){
    super();

    this.name = methodName;
    this.className = "container row v-center pad-500 inline-construct";

    this.#method = method;

    this.#comboboxes = method.params.map(param => {
      const comboBox = new ExtendedComboBox("cb", []);
      comboBox.disabled = true;
      return { param, comboBox };
    });

    const children = method.representation.map(text => {
      if(text[0] === "$"){
        const paramIndex = Number.parseInt(text.substring(1));
        const { comboBox } = this.#comboboxes[paramIndex];
        if(!this.#argsMap.has(paramIndex)){
          this.#argsMap.set(paramIndex, [ comboBox ]);
        } else {
          this.#argsMap.get(paramIndex).push(comboBox);
        }
        return comboBox;
      }
      // if(text[0] === "#"){
      //   return new Text();
      // }
      return new Text(text);
    });

    this.append(...children);
  }

  /**
   * @template {Exclude<keyof StructureScopeMap, "global">} T
   * @param {{ data: Structure; all: <S>(scope: S) => { [type in keyof StructureTypeMap]: { name: string; info: string; scope: S; collection: "literals" | "variables" | "methods" }[] }; }} Builder
   * @param {T} scopeName
   * @param {StructureScope<T>} scope
   */
  async input(Builder, scopeName, scope){
    let selectedType = {};
    for(const [ index, { param, comboBox } ] of this.#comboboxes.entries()){
      let acceptedTypes = [ param ];
      const paramSet = param + "[]";
      if(param in selectedType){
        acceptedTypes = [ selectedType[param] ];
      } else if(paramSet in selectedType){
        acceptedTypes = [ selectedType[paramSet] ];
      } else if(this.#method.templates){
        if(param in this.#method.templates){
          acceptedTypes = this.#method.templates[param];
        } else if(paramSet in this.#method.templates) {
          acceptedTypes = this.#method.templates[param].map(type => type + "[]");
        }
      }
      // console.log(variablesMap, acceptedTypes, method, methodName)
      const typesMap = $ssp.getTypesMap(scopeName);
      const options = acceptedTypes
        .filter(type => type in typesMap)
        .map(type => typesMap[type]).flat();
      // console.log(acceptedTypes, options);
      comboBox.addOptions(...options.map((option, optionIndex) => ({
        optionCollection: option.collection,
        optionScope: option.scope,
        type: option.type,
        optionIndex,
        value: option.name,
        info: option.info
      })));
      comboBox.placeholder = acceptedTypes.join(" | ");
      comboBox.disabled = false;
      comboBox.focus();
      const { value, optionIndex, type, info, optionScope, optionCollection } = await comboBox.listenForChange();
      if(optionCollection === "methods"){
        const method = $ssp.getMethod(optionScope, value, type);
        console.log(method);
        selectedType[param] = type;
        await this.setArgWithInline(index, value, method, Builder, scopeName, scope);
        continue;
      }
      selectedType[param] = type;
      this.setArgWithText(index, value, info);
    }
  }

  /**
   * @param {number} index
   * @param {string} value
   * @param {string} info
  */
  setArgWithText(index, value, info){
    this.args[index] = value;
    this.#argsMap.get(index)?.forEach(element => {
      this.replaceChild(new Code({ innerText: info }), element);
    });
  }

  /**
   * @param {number} index
   * @param {string} value
  */
  async setArgWithInline(index, methodName, method, Builder, scopeName, scope){
    const elements = this.#argsMap.get(index);
    for(const element of elements){
      const inlineConstruct = new InlineConstruct(methodName, method);
      this.args[index] = inlineConstruct;
      this.replaceChild(inlineConstruct, element);
      await inlineConstruct.input(Builder, scopeName, scope);
    }
  }

  static from(methodName, method, args = []){
    const instance = new InlineConstruct(methodName, method);
    for(const [index, arg] of args.entries()){
      if(arg instanceof InlineConstruct){
        const elements = instance.#argsMap.get(index);
        for(const element of elements){
          instance.args[index] = arg;
          instance.replaceChild(arg, element);
        }
      } else{
        instance.args[index] = arg.value;
        instance.#argsMap.get(index)?.forEach(element => {
          instance.replaceChild(new Code({ innerText: arg.info }), element);
        });
      }
    }
    return instance;
  }

};

customElements.define("inline-construct", InlineConstruct, { extends: "div" });