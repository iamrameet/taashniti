/// <reference path="../library/prototype-extended.js"/>

import NavRouter from "../library/nav-router.js";
import ElementsBuilder from "../library/elements-builder.js";
import ComboBox from "../components/combobox.js";
import BuilderData from "./structure.js";
import ConstructCombo from "../components/construct-combo.js";
import ElementBuilder from "./element-builder.js";
import StructureScopeParser from "./structure-parser.js";

globalThis.$ssp = new StructureScopeParser(BuilderData);

/**
 * @template {keyof BuilderData["scopes"]} S
 * @typedef {BuilderData["scopes"][S]["variables"]} BuilderDataVars
*/

class Builder {

  static data = BuilderData;

  static #variables(variablesMap, scope){
    const { variables } = BuilderData.scopes[scope];
    for(const name in variables){
      const { type, info } = variables[name];
      const object = { name, info, scope, collection: "variables" };
      if(type in variablesMap === false){
        variablesMap[type] = [ object ];
        continue;
      }
      variablesMap[type].push(object);
    }
  }

  static #literals(literalsMap, scope){
    const { literals } = BuilderData.scopes[scope];
    for(const name in literals){
      const { type, info } = literals[name];
      const object = { name, info, scope, collection: "literals" };
      if(type in literalsMap === false){
        literalsMap[type] = [ object ];
        continue;
      }
      literalsMap[type].push(object);
    }
  }

  /**
   * @param {}
   * @param {keyof BuilderData["scopes"]} scope
  */
  static #methods(methodsMap, scope){
    const { methods } = BuilderData.scopes[scope];
    for(const name in methods){
      /** @type {BuilderData["scopes"]["global"]["methods"]["equals"]} */ 
      const { returns, info, templates = {} } = methods[name];
      const object = { name, info, scope, collection: "methods" };
      let types = [ returns ];
      if(returns in templates){
        types = templates[returns];
      }
      for(const type of types){
        if(type in methodsMap === false){
          methodsMap[type] = [ object ];
          continue;
        }
        methodsMap[type].push(object);
      }
    }
  }

  /**
   * @template S
   * @param {S} scope
   */
  static variables(scope){
    /** @type {{ [type in keyof BuilderData["types"]]: { name: string; info: string; scope: S; collection: "variables" } }} */
    const variablesMap = {};
    this.#variables(variablesMap, "global");
    this.#variables(variablesMap, scope);
    return variablesMap;
  }

  /**
   * @template S
   * @param {S} scope
   */
  static literals(scope){
    /** @type {{ [type in keyof BuilderData["types"]]: { name: string; info: string; scope: S; collection: "literals" } }} */
    const literalsMap = {};
    this.#literals(literalsMap, "global");
    this.#literals(literalsMap, scope);
    return literalsMap;
  }

  /**
   * @template S
   * @param {S} scope
   */
  static methods(scope){
    /** @type {{ [type in keyof BuilderData["types"]]: { name: string; info: string; scope: S; collection: "methods" } }} */
    const methodsMap = {};
    this.#methods(methodsMap, "global");
    this.#methods(methodsMap, scope);
    return methodsMap;
  }

  /**
   * @template S
   * @param {S} scope
   */
  static all(scope){
    /** @type {{ [type in keyof BuilderData["types"]]: { name: string; info: string; scope: S; collection: "methods" | "variables" | "literals" } }} */
    const allMap = {};
    this.#literals(allMap, "global");
    this.#literals(allMap, scope);
    this.#variables(allMap, "global");
    this.#variables(allMap, scope);
    this.#methods(allMap, "global");
    this.#methods(allMap, scope);
    return allMap;
  }

  /**
   * @template S
   * @param {S} scope
   */
  static allOfTypes(scope, types = []){
    /** @type {{ [type in keyof BuilderData["types"]]: { name: string; info: string; scope: S; collection: "methods" | "variables" | "literals" } }} */
    const allMap = {};
    this.#literals(allMap, "global");
    this.#literals(allMap, scope);
    this.#variables(allMap, "global");
    this.#variables(allMap, scope);
    this.#methods(allMap, "global", types);
    this.#methods(allMap, scope, types);
    return allMap;
  }

  static findLiteralOrVariable(scope, name){
    const localScope = BuilderData.scopes[scope];
    if(name in localScope.literals){
      return { collection: "literals", scope, ...localScope.literals[name] };
    }
    if(name in localScope.variables){
      return { collection: "variables", scope, ...localScope.variables[name] };
    }
    const globalScope = BuilderData.scopes.global;
    if(name in globalScope.literals){
      return { collection: "literals", scope: "global", ...globalScope.literals[name] };
    }
    return { collection: "variables", scope: "global", ...globalScope.variables[name] };
  }

};

globalThis.Builder = Builder;

/**
 * @param {{ info: string; params: (keyof BuilderData["types"])[]; returns: keyof BuilderData["types"]; templates?: { [name: string]: (keyof BuilderData["types"])[] } }} method */
function createOverloads(method){
  for(const template in method.templates){}
}

function elementsById(log = false){
  const obj = {};
  let str = "/** @type {{ ";
  document.querySelectorAll("[id]").forEach(element => {
    str += element.id + ": " + element.constructor.name + "; ";
    obj[element.id] = element;
  });
  if(str.includes(";")){
    str = str.substring(0, str.length - 2);
  }
  if(log){
    console.log(str + " }} */");
  }
  Object.freeze(obj);
  Object.seal(obj);
  Object.preventExtensions(obj);
  return obj;
}

const {
  div: Div,
  span: Span,
  p: Paragraph,
  input: Input
} = ElementsBuilder.multiple("div", "span", "p", "input");

async function main(){

  /** @type {{ route0: HTMLDivElement; events: HTMLDivElement; route1: HTMLDivElement; subroute1: HTMLDivElement; subroute2: HTMLDivElement; route2: HTMLDivElement; notFound: HTMLDivElement }} */
  const $E = elementsById(true);

  const router = new NavRouter({
    "/route1": {
      element: $E.route1,
      subRoutes: {
        "/subroute1": {
          element: $E.subroute1
        },
        "/subroute2": {
          element: $E.subroute2
        }
      }
    },
    "/route2": {
      element: $E.route2
    },
    "/": {
      element: $E.route0
    },
    "/*": {
      element: $E.notFound
    }
  }, "/");

  router.on("render", (path, element) => {
    console.log(path, element);
  });

  window.router = router;

  // const socketClient = new WebSocket("ws://localhost:800");
  // console.log({socketClient});

  const loadedData = JSON.parse(localStorage.getItem("donkey-game") ?? "{}");
  for(const scopeName in loadedData.events){
    const { json } = loadedData.events[scopeName];
    const elementBuilder = new ElementBuilder(Builder, scopeName);
    const eventElement = new Div({
      className: "container w-fill event pad gap"
    });
    eventElement.appendChild(new Paragraph({
      className: "container text heading",
      innerText: BuilderData.scopes[scopeName].info
    }));
    for(const statement of json){
      const element = elementBuilder.statement(statement);
      // console.log(element);
      eventElement.appendChild(element);
    }
    $E.events.appendChild(eventElement);
  }

  // const input = new Input({
  //   type: "text",
  //   placeholder: "Type 'I agree' to continue",
  //   $parentElement: $E.route0,
  //   focus: [],
  //   $styles: { padding: "1rem" }
  // });
  // await input.listen("keypress", event => event.key === "Enter" && event.currentTarget.value === "I agree");
  // input.remove();

  const combo = new ComboBox(
    "combo-1",
    Object.entries(BuilderData.scopes)
      .filter(scope => scope[0] !== "global")
      .map(([ scope, { info } ]) => ({
        value: scope,
        info
      }))
  );
  combo.placeholder = "Add event";

  $E.route0.append(combo);

  combo.addEventListener("change", async function(event){

    /** @type {keyof BuilderData["scopes"]} */
    const eventName = combo.value;
    const eventInfo = combo.optionInfo;
    // const scope = BuilderData.scopes[eventName];

    const eventElement = new Div({
      className: "container w-fill event pad"
    });
    $E.events.appendChild(eventElement);

    // make a function/class for it
    const constructsCombo = new ConstructCombo(eventName);
    eventElement.append(new Text(eventInfo), constructsCombo);
    constructsCombo.focus();
    constructsCombo.handleChange(element => eventElement.appendChild(element), BuilderData, Builder, true);
    // const constructsCombo = new ComboBox("constructs-list", [
    //   { value: "if", info: "Conditional" },
    //   { value: "invoke", info: "Expression" }
    // ]);
    // constructsCombo.placeholder = "Choose a construct";

    // constructsCombo.addEventListener("change", async function(event){

    //   /** @type {"if" | "invoke"} */
    //   const constructName = constructsCombo.value;

    //   if(constructName === "invoke"){
    //     constructsCombo.remove();
    //     // this.disabled = true;
    //     const methodsCombo = new ComboBox("methods-list", [
    //       ...Object.entries(scope.methods),
    //       ...Object.entries(BuilderData.scopes.global.methods),
    //     ]
    //       // .filter(entry => entry[1].returns === "Void")
    //       .map(([ name, method ]) => ({ value: name, info: method.info }))
    //     );
    //     methodsCombo.classList.add("container", "row");
    //     methodsCombo.placeholder = "Choose an action";
    //     eventElement.append(methodsCombo);
    //     methodsCombo.focus();

    //     await methodsCombo.listen("change");

    //     methodsCombo.disabled = true;
    //     /** @type {keyof (BuilderData["scopes"]["global"] & scope)["methods"]} */
    //     const methodName = methodsCombo.value;
    //     const { methods } = methodName in scope.methods ? scope : BuilderData.scopes.global;
    //     /** @type {(BuilderData["scopes"]["global"] & scope)["methods"][methodName]} */
    //     const method = methods[methodName];

    //     const inlineConstruct = new InlineConstruct(method);
    //     eventElement.appendChild(inlineConstruct);
    //     methodsCombo.remove();
    //     await inlineConstruct.input(Builder, eventName, scope);
    //   }
    //   else if(constructName === "if") {
    //     constructsCombo.remove();
    //     // this.disabled = true;
    //     const blockConstruct = new BlockConstruct();
    //     eventElement.appendChild(blockConstruct);
    //     await blockConstruct.input(Builder, eventName, scope);
    //   }
    // });

    this.value = "";
  });

}

if(document.readyState == "complete") main();
else window.addEventListener("load", main, { once: true });

/**
 * @template {any[]} T
 * @param {(count: number, ...args: T) => number} callback
 * @param {number} ms
 * @param {T} args
*/
function setCounterInterval(callback, ms, ...args){
  let count = 0;
  return setInterval((...args) => callback(count++, ...args), ms, ...args);
}