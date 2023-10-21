/// <reference path="fn.h.ts"/>

/** @template T */
export default class Fn {

  /** @enum */
  static types = {
    Number: 1,
    String: 2,
    Boolean: 4,
    Object: 8,
    Array: 16
  };
  /** @type {{ [key: string]: cb: (...args: TypeOfMap[keyof TypeOfMap][]) => void }} */
  #functions = {};

  /** @param {T} overloads */
  constructor(...overloads){
    for(const overload of overloads){
      const [ fn, ...args ] = overload;
      const key = Fn.#createKeyOfType(args);
      this.#functions[key] = fn;
    }
  }

  /**
   * @template This
   * @template {Array<keyof TypeOfMap>} A
   * @template R
   * @param {This} _this
   * @param {A} args
   * @param {(...args: TypeOfKey<A>) => R} cb
   * @returns {[ cb: (this: This, ...args: TypeOfKey<A>) => R, ...args: A]} */
  static overloadFormat(_this, cb, ...args){
    return [ cb, ...args ];
  }

  /**
   * @template {Parameters<T[number][0]>} F
   * @param {F} args
   * @returns {ReturnType<T[number][0]>}
  */
  call(...args){
    const key = Fn.#createKey(args);
    if(key in this.#functions === false){
      throw "No instance of overloaded function";
    }
    return this.#functions[key](...args);
  }

  static #createKey(args = []){
    return args.map(arg => typeof arg).join("-");
  }
  static #createKeyOfType(args = []){
    return args.join("-");
  }

  /**
   * @template T
   * @param {T} args
   * @return {Fn<T>["call"]} */
  static direct(...args){
    const fn = new this(...args);
    return fn.call.bind(fn);
  };
};