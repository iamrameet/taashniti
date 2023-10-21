/// <reference path="ui-component-imports.ts"/>
/**
 * @typedef {{class: string, classList: string[], id: string, html: string, children: HTMLElement[]}} AttrsObject
 * @typedef {{[key in keyof HTMLElementEventMap]: (event: HTMLElementEventMap[key])}} EventsObject
 */

/**
 * @template {HTMLElement} E
 * @template C */
class UIComponent{

  /**
   * @param {E} element
   * @param {C} components
   */
  constructor(element, components){
    this.element = element;
    this.components = components;
  }

  /** @param {{[attributeName: string]: string}} attributes */
  attr(attributes){
    for(const property in attributes){
      if(typeof attributes[property] === "boolean"){
        this.element.toggleAttribute(property, attributes[property]);
        continue;
      }
      this.element.setAttribute(property, attributes[property]);
    }
    return this;
  }

  /**
   * @template {keyof E} P
   * @param {P} property */
  getProperty(property){
    return this.element[property];
  }

  /** @param {Partial<E>} properties */
  property(properties){
    for(const property in properties){
      this.element[property] = properties[property];
    }
    return this;
  }

  /** @param {CSSStyleDeclaration} styles */
  style(styles){
    for(const property in styles){
      this.element.style[property] = styles[property];
    }
    return this;
  }

  /**
   * @param {EventsObject} events
   * @param {boolean | AddEventListenerOptions} [options]*/
  on(events, options){
    for(const eventName in events){
      this.element.addEventListener(eventName, events[eventName], options);
    }
    return this;
  }

  /**
   * @param {EventsObject} events
   * @param {boolean | EventListenerOptions} [options]*/
  off(events, options){
    for(const eventName in events){
      this.element.removeEventListener(eventName, events[eventName], options);
    }
    return this;
  }

  clear(){
    this.element.innerText = "";
    return this;
  }

  /** @param {HTMLElement[]} elements */
  append(...elements){
    this.element.append(...elements);
    return this;
  }

  /** @param {HTMLElement[]} elements */
  prepend(...elements){
    this.element.prepend(...elements);
    return this;
  }
  get children(){
    return new Array(...this.element.children).map(childElement => new UIComponent(childElement));
  }

  /** @param {(component: this)} fn */
  scope(fn){
    fn(this);
    return this;
  }

  /**
   * @param {C} id
   * @param {UIComponent<HTMLElement>} component */
  addComponentAs(id, component){
    this.components[id] = component;
    return this;
  }

  /** @param {UIComponent<HTMLElement>[]} components */
  addComponent(...components){
    for(const component of components){
      const id = component.element.id;
      if(!id){
        throw "Element must have a valid Id";
      }
      this.components[id] = component;
    }
    return this;
  }

  /**
   * @template {HTMLElement} E
   * @param {UIComponent<E>[]} components
   * @param {E} properties */
  static property(components, properties){
    for(const component of components){
      component.property(properties);
    }
    return this;
  }

  /**
   * Creates a new Component using tagName
   * @template {keyof HTMLElementTagNameMap} E
   * @template {{}} C
   * @param {E} tagName
   * @param {Partial<HTMLElementTagNameMap[E]>} properties
   * @param {C} components
   */
  static fromTagName(tagName, properties = {}, components = {}) {
    const element = document.createElement(tagName);
    return new UIComponent(element, components).property(properties);
  }

};

class Import{

  /** @typedef {{ html: string, script: string | null, style: string | null }} HTMLImport */
  /** @type {{ [path: string]: HTMLImport }} */
  static #imports = {};
  static #id = {
    counter: 0,
    generate(){
      return (Date.now() + this.counter++).toString(36);
    }
  };

  /**
   * @template {keyof UIComponentImportMap} P
   * @param {P} path
   * @param {{ args: UIComponentImportMap[P]["args"] }} options
   * @returns {Promise<UIComponent<UIComponentImportMap[P]["elementType"], UIComponentImportMap[P]["components"]>>}
   */
  static async asUIComponent(path, options = {}){
    options.args = options?.args ?? {};
    if(path in this.#imports){
      return this.#asComponent(path, options.args);
    }
    try{
      this.#imports[path] = await this.#fetchFiles(path);
      return this.#asComponent(path, options.args);
    }catch(ex){
      throw ex;
    }
  }

  /**
   * @template {keyof UIComponentImportMap} P
   * @template {{}} A
   * @param {P} path
   * @param {{ fallbackArgs: A }} options
   * @returns {Promise<CustomElementInterface<A, UIComponentImportMap[P]["returns"]>>}
   */
  static async asCustomElement(path, options = {}){
    const elementName = this.#customElementName(path);
    let CustomElement = customElements.get(elementName);
    if(CustomElement){
      if("fallbackArgs" in options){
        CustomElement.fallbackArgs = options.fallbackArgs;
      }
      return CustomElement;
    }
    try{
      this.#imports[path] = await this.#fetchFiles(path);
      CustomElement = this.#function(this.#imports[path])();
      if("fallbackArgs" in options){
        CustomElement.fallbackArgs = options.fallbackArgs;
      }
      customElements.define(elementName, CustomElement);
      return CustomElement;
    }catch(ex){
      throw ex;
    }
  }

  static #asComponent(path, args){
    const imported = this.filter(this.#imports[path], args);
    const id = this.#id.generate();
    const script = this.#wrapScriptCode(id, imported.script, args);
    return this.#createComponent(this.#parse(imported.html), imported.style, script);
  }

  static #customElementName(path = ""){
    const lastIndexOfSlash = path.lastIndexOf("/");
    return path.substring(lastIndexOfSlash + 1);
  }

  static filter({html, style, script}, args = {}){
    for(const name in args){
      const regex = new RegExp(`{{${name}}}`, "g");
      html = html.replace(regex, args[name]);
      style = style.replace(regex, args[name]);
      script = script.replace(regex, args[name]);
    }
    return { html, style, script };
  }

  static #getByType(value){
    switch(typeof value){
      case "string": return `"${value}"`;
      default: return value;
    }
  }

  static #parse(string){
    const parser = new DOMParser();
    const [ element ] = parser.parseFromString(`${string}`, "text/html").body.children;
    return element;
  }

  /** @param {HTMLTemplateElement} element */
  static #createComponent(element, style, script){
    /** @type {HTMLElement} */
    const fragment = element.cloneNode(true);
    fragment.append(
      UIComponent.fromTagName("style", { textContent: style }).element,
      UIComponent.fromTagName("script", { textContent: script }).element
    );
    return new UIComponent(
      fragment,
      this.#parseChildrenById(fragment)
    );
  }

  /** @param {Element} element */
  static #parseChildrenById(element){
    const components = {};
    element.querySelectorAll("[id]").forEach(childElement => {
      components[childElement.id] = new UIComponent(childElement);
    });
    return components;
  }

  static #wrapScriptCode(id, code, object = {}){
    return `(function(){
      const $args = {${Object.keys(object).map(key => `${key}: ${this.#getByType(object[key])}`).join(",")}};
      const $E = Array.from(this.querySelectorAll("[id]")).map(element => ({ [element.id]: element })).reduce((a, b) => ({ ...a, ...b }), {});
      ${code}
    }).bind(document?.currentScript.parentElement ?? document.getElementById("${id}"))();`;
  }

  /** @param {string} path */
  static async #fetchFile(path, throwError = false){
    try{
      const response = await fetch(path);
      if(response.status !== 200){
        throw response.statusText;
      }
      const text = await response.text();
      return text;
    }catch(ex){
      if(throwError){
        throw ex;
      }
      return "";
    }
  }

  static async #fetchFiles(path){
    const html = await this.#fetchFile(path + ".html", true);
    const script = await this.#fetchFile(path + ".js");
    const style = await this.#fetchFile(path + ".css");
    return { html, script, style };
  }

  /** @param {Import} imported */
  static #function(imported){
    return new Function(`return class CE extends HTMLElement{
      static fallbackArgs = {};
      #imported = {
        html: \`${imported.html}\`,
        style: \`${imported.style}\`,
        script: \`${imported.script}\`
      };
      #returns;
      #shadowRoot = this.attachShadow({ mode: "closed" });

      constructor($args = {}){
        super();
        for(const name in CE.fallbackArgs){
          if(name in $args) continue;
          const value = this.getAttribute("arg-" + name) ?? CE.fallbackArgs[name];
          $args[name] = value;
        }
        const imported = Import.filter(this.#imported, $args);
        this.#shadowRoot.innerHTML = \` <style>\${imported.style}</style> \${imported.html}\`;

        const $E = this.elements;
        this.#returns = (() => {
          ${imported.script}
        }).call();

      }

      get elements(){
        return Array.from(this.#shadowRoot.querySelectorAll("[id]")).map(element => ({ [element.id]: element })).reduce((a, b) => ({ ...a, ...b }), {});
      }

      get returns(){
        return this.#returns;
      }

      connectedCallback(){
        console.log(10);
      }
    };`);
  }
};