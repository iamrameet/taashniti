export default class Import{

  /** @typedef {{ html: string, script: string | null, style: string | null }} HTMLImport */
  /** @type {{ [path: string]: HTMLImport }} */
  static #imports = {};
  static #id = {
    counter: 0,
    generate(){
      return (Date.now() + this.counter++).toString(36);
    }
  };

  static async asUIComponent(path, options = { args: {} }){
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

  static #asComponent(path, args){
    const imported = this.#filter(this.#imports[path], args);
    const id = this.#id.generate();
    const script = this.wrapScriptCode(id, imported.script, args);
    return this.createComponent(this.parse(imported.html), imported.style, script);
  }

  /** @param {string} path */
  static async asCustomElement(path, options = { args: {} }){
    options.args = options?.args ?? {};
    const elementName = this.customElementName(path);
    console.log({elementName});
    let CustomElement = customElements.get(elementName);
    if(CustomElement){
      return CustomElement;
    }
    try{
      this.#imports[path] = await this.#fetchFiles(path);
      const imported = this.#filter(this.#imports[path], options.args);
      CustomElement = this.#function(imported, options.args)();
      customElements.define(elementName, CustomElement);
      return CustomElement;
    }catch(ex){
      throw ex;
    }
  }

  static customElementName(path = ""){
    const lastIndexOfSlash = path.lastIndexOf("/");
    return path.substring(lastIndexOfSlash + 1);
  }

  static #filter({html, style, script}, args = {}){
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

  static parse(string){
    const parser = new DOMParser();
    const [ element ] = parser.parseFromString(`${string}`, "text/html").body.children;
    return element;
  }

  /** @param {HTMLTemplateElement} element */
  static createComponent(element, style, script){
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

  static wrapScriptCode(id, code, object = {}){
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

  static #function(imported, args){
    return new Function(`return class extends HTMLElement{
      constructor(){
        super();
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.innerHTML = \` <style>${imported.style}</style> ${imported.html}\`;

        const $args = {${
          Object.keys(args).map(key => `${key}: ${this.#getByType(args[key])}`).join(",")
        }};
        const $E = Array.from(shadowRoot.querySelectorAll("[id]")).map(element => ({ [element.id]: element })).reduce((a, b) => ({ ...a, ...b }), {});
        ${imported.script}

      }
      connectedCallback(){
        console.log(10);
      }
    };`);
  }
};