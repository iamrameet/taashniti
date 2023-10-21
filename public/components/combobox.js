/// <reference path="../library/prototype-extended.d.ts"/>

import ElementsBuilder from "../library/elements-builder.js";

const {
  input: Input,
  datalist: DataList,
  select: Select,
  option: Option
} = ElementsBuilder.multiple("input", "datalist", "select", "option");

/** @typedef {{ value: string; info: string; }} DataListOption */
/** @typedef {(listId: string, options: DataListOption[]) => ExtendedBuilderElementReturnType<HTMLDivElement> } ComboboxConstructor */
/** @typedef {{ "option-add": CustomEvent<ComboBox>; "option-remove": CustomEvent<ComboBox>; }} ComboBoxEventMap */

export default class ComboBox extends HTMLDivElement {

  /** @type {HTMLInputElement} */
  #input;
  /** @type {HTMLDataListElement} */
  #list;

  /**
   * @param {string} listId
   * @param {DataListOption[]} options
  */
  constructor(listId, options){

    super();

    this.#input = new Input({
      type: "text",
      $attributes: {
        list: listId
      }
    });

    this.#list = new DataList({
      id: listId,
      append: options.map(option => new Option({
        id: option.value,
        value: option.value,
        innerText: option.info
      }))
    });

    this.append(this.#input, this.#list);
  }

  get placeholder(){
    return this.#input.placeholder;
  }
  set placeholder(value){
    this.#input.placeholder = value;
  }

  get value(){
    return this.#input.value;
  }
  set value(value){
    this.#input.value = value;
  }

  get disabled(){
    return this.#input.disabled;
  }
  set disabled(value){
    this.#input.disabled = value;
  }

  get optionInfo(){
    return this.#list.options[this.#input.value]?.innerText;
  }

  focus(){
    this.#input.focus();
  }

  /** @param {DataListOption[]} option */
  addOptions(...options){
    for(const option of options){
      this.#list.appendChild(new Option({
        id: option.value,
        value: option.value,
        innerText: option.info
      }));
      this.dispatchEvent(new CustomEvent("option-add"));
    }
  }

  /** @param {string} optionId */
  removeOption(optionId){
    if(optionId in this.#list.options === false){
      return false;
    }
    this.#list.options[optionId].remove();
    this.dispatchEvent(new CustomEvent("option-remove"));
    return true;
  }

  /**
   * @template {keyof (HTMLElementEventMap & ComboBoxEventMap)} T
   * @param {T} type
   * @param {(this: ComboBox, event: (HTMLElementEventMap & ComboBoxEventMap)[T]) => any} listener
   * @param {AddEventListenerOptions} options
  */
  addEventListener(type, listener, options){
    switch(type){
      case "change":
        return this.#handleChangeEvent(listener, options);
    }
    super.addEventListener(type, listener, options);
  }

  /**
   * @param {(this: ComboBox, event: Event) => void} listener
   * @param {AddEventListenerOptions} options
   */
  #handleChangeEvent(listener, options){
    this.#input.addEventListener("change", event => {
      for(const option of this.#list.options){
        if(this.#input.value === option.value){
          return listener.call(this, event);
        }
      }
      this.#input.value = "";
    }, options);
  }

};

customElements.define("combo-box", ComboBox, { extends: "div" });

export class ExtendedComboBox extends ComboBox {

  static #counter = 0;
  /** @type {{ [name: string]: DataListOption }} */
  #options = {};

  /**
   * @param {string} listId
   * @param {DataListOption[]} options
  */
  constructor(listId, options){
    super(listId + ExtendedComboBox.#counter++, options);
    for(const option of options){
      this.#options[option.value] = option;
    }
    this.className = "container row pad-250";
  }

  addOptions(...options){
    super.addOptions(...options);
    for(const option of options){
      if(option.value in this.#options){
        super.removeOption(option.value);
      }
      this.#options[option.value] = option;
    }
  }

  removeOption(optionValue){
    if(super.removeOption(optionValue)){
      return delete this.#options[optionValue];
    }
    return false;
  }

  /** @returns {Promise<DataListOption>} */
  async listenForChange(){
    const t = await this.listen("change", () => this.value in this.#options);
    return this.#options[this.value];
  }

};

customElements.define("x-combo-box", ExtendedComboBox, { extends: "div" });