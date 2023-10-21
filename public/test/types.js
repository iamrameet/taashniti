class Type {
  /** @type {"string" | "number" | "boolean"} */
  static #primitiveType;
  static get primitiveType(){
    return this.#primitiveType;
  }
  /** @param {"string" | "number" | "boolean"} primitiveType */
  static new(primitiveType){
    /** @template T */
    return class NewType extends Type {
      static #primitiveType = primitiveType;
      static get primitiveType(){
        return this.#primitiveType;
      }
      /** @param {} value */
      constructor(value){}
    };
  }
};