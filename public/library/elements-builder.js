/// <reference path="elements-builder.h.ts"/>

/** @typedef {Partial<CSSStyleDeclaration> & { properties?: { [property: string]: string | null | [ string | null, string | undefined ] } }} ElementsBuilderStyles */

export default class ElementsBuilder {

  /**
   * @template {keyof HTMLElementTagNameMap} T
   * @param {T} tagName
   * @returns {BuilderElementType<HTMLElementTagNameMap[T]>}
   */
  static single(tagName){

    return class BuilderElement {

      static #tagName = tagName;

      constructor(properties = {}, options = undefined){
        return BuilderElement.#create(properties, options);
      }

      /**
       * @param {ElementsBuilderProperties<HTMLElementTagNameMap[T]>} properties
       * @param {ElementCreationOptions} [options]
       */
      static #create(properties, options){
        const element = document.createElement(BuilderElement.#tagName, options);
        ElementsBuilder.#applyProperties(element, properties);
        ElementsBuilder.#applyStyle(element, properties.$styles);
        return element;
      };

    };

  }

  /**
   * @template {keyof HTMLElementTagNameMap} T
   * @param {T[]} tagNames
   */
  static multiple(...tagNames){

    /** @type {{ [tagName in T]: BuilderElementType<HTMLElementTagNameMap[tagName]> }} */
    const object = {};
    for(const tagName of tagNames){
      object[tagName] = ElementsBuilder.single(tagName);
    }
    return Object.freeze(object);

  }

  /**
   * @template {keyof HTMLElementTagNameMap} T
   * @template {any[]} A
   * @template {{ [property: string]: (this: HTMLElementTagNameMap[T], ...args: any[]) => any }} P
   * @param {T} tagName
   * @param {(...args: A) => ExtendedBuilderElementReturnType<HTMLElementTagNameMap[T]>} constructor
   * @param {P} properties
   * @returns {ExtendedBuilderElementType<HTMLElementTagNameMap[T] & P, A>}
  */
  static extended(tagName, constructor, properties){

    return class ExtendedBuilderElement extends ElementsBuilder.single(tagName) {

      /** @param {A} args */
      constructor(...args){
        super(...constructor?.(...args) ?? []);
        Object.assign(this, properties);
      }

    };

  }

  /**
   * @param {HTMLElement} element
   * @param {ElementsBuilderStyles} styles
  */
  static #applyStyle(element, styles = {}){

    // set style property
    for(const name in styles.properties){
      const value = styles.properties[name];
      const value_priority = value instanceof Array ? value : [ value ];
      element.style.setProperty(name, ...value_priority);
      // const isArray = value instanceof Array;
      // element.style.setProperty(name, isArray ? value[0] : value, isArray ? value[1] : undefined);
    }

    // set style
    for(const property in styles){
      if(property in element.style === false){
        continue;
      }
      element.style[property] = styles[property];
    }

  }

  /**
   * @template {HTMLElement} T
   * @param {T} element
   * @param {ElementsBuilderProperties<HTMLElementTagNameMap[T]>} properties
  */
  static #applyProperties(element, properties = {}){

    for(const attribute in properties.$attributes){
      element.setAttribute(attribute, properties.$attributes[attribute]);
    }

    for(const eventName in properties.$listeners){
      element.addEventListener(eventName, properties.$listeners[eventName]);
    }

    if("$parentElement" in properties){
      properties.$parentElement.appendChild(element);
    }

    for(const [ property, value ] of Object.entries(properties)){
      if(property in element === false){
        continue;
      }
      if(typeof element[property] === "function"){
        element[property](...(value instanceof Array ? value : [ value ]));
        continue;
      }
      element[property] = value;
    }

  }

};