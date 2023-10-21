/// <reference path="data-manager.h.ts"/>

import Listeners from "../public/library/listeners.js";

/**
 * @template C
 * @template {InstanceType<C>} T
 */
export default class DataManager{
  #type;
  /** @type {string[]} */
  #order = [];
  /** @type {Map<string, T>} */
  #data = new Map();
  /** @type {Listeners<DataManagerListeners<T>>} */
  #listener = new Listeners(["add", "remove", "update", "update-id", "select", "unselect", "change"]);
  #controller;
  #selectionFrozen = false;
  /** @type {string} */
  #selected = null;

  /** @param {C} type */
  constructor(type, controller = new DataManager.Controller()){
    this.#type = type;
    if(controller instanceof DataManager.Controller === false){
      throw "controller must be an instance of DataManager.Controller";
    }
    this.#controller = controller;
    this.#controller.attach(this);
  }

  get size(){
    return this.#data.size;
  }

  get selected(){
    return this.#data.get(this.#selected);
  }

  /** @param {string} id */
  has(id){
    return this.#data.has(id);
  }

  /** @param {string} id */
  get(id){
    return this.#data.get(id);
  }

  /** @param {(data: T, key: string) boolean} predicate */
  find(predicate){
    for(const [key, data] of this.#data){
      if(predicate(data, key) === true)
        return data;
    }
    return null;
  }

  /** @param {(data: T, key: string) boolean} predicate */
  any(predicate){
    for(const [key, data] of this.#data){
      if(predicate(data, key) === true)
        return true;
    }
    return false;
  }

  /** @param {(data: T, key: string) boolean} predicate */
  every(predicate){
    for(const [key, data] of this.#data){
      if(predicate(data, key) === false)
        return false;
    }
    return true;
  }

  /** @param {(data: T, key: string) boolean} predicate */
  filter(predicate){
    /** @type {[T, key][]} */
    const array = [];
    for(const [key, data] of this.#data){
      if(predicate(data, key) === true)
        array.push([data, key]);
    }
    return array;
  }

  /** @param {string} key */
  findIndex(key){
    return this.#order.indexOf(key);
  }

  /** @param {number} index */
  at(index){
    return this.get(this.#order.at(index));
  }
  /** @param {number} index */
  atPrevious(index){
    return this.get(this.#order[index - 1]);
  }
  /** @param {number} index */
  atNext(index){
    return this.get(this.#order[index + 1]);
  }
  atFirst(){
    return this.get(this.#order[0]);
  }
  atLast(){
    return this.get(this.#order[this.#order.length - 1]);
  }

  /** @type {Listeners<DataManagerListeners<T>>["on"]} */
  on(eventName, handler){
    return this.#listener.on(eventName, handler);
  }
  /** @type {Listeners<DataManagerListeners<T>>["once"]} */
  once(eventName, handler){
    this.#listener.once(eventName, handler);
  }

  /** @param {string} id */
  select(id){
    if(this.#selectionFrozen){
      throw this + ".: Selection is frozen";
    }
    const data = this.#data.get(id);
    if(data){
      const prevId = this.#selected;
      this.unselect();
      this.#selected = id;
      this.#listener.trigger("select", data, id);
      if(prevId !== this.#selected){
        this.#listener.trigger("change", data, id, this.#data.get(prevId), prevId);
      }
    }
  }
  unselect(){
    const data = this.#data.get(this.#selected);
    if(data){
      this.#listener.trigger("unselect", data, this.#selected);
    }
    this.#selected = false;
  }

  /**
   * @param {string} id
   * @param {T} data
   * @param {number} [index] */
  add(id, data, index){
    if(data instanceof this.#type === false){
      throw `data must be an instance of ${this.#type.name}`;
    }
    if(typeof index !== "number" || index < 0 || index >= this.#order.length){
      index = this.#order.length;
    }
    this.#data.set(id, data);
    this.#order.splice(index, 0, id);
    this.#listener.trigger("add", data, index, id);
  }
  /**
   * @param {string} id
   * @param {ConstructorParameters<C>} args
   * @param {{ index: number, select: boolean }} options */
  emplace(id, options = {}, ...args){
    let { index, select } = options ?? {};
    if(typeof index !== "number" || index < 0 || index >= this.#order.length){
      index = this.#order.length;
    }
    /** @type {T} */
    const data = new this.#type(...args);
    this.#data.set(id, data);
    this.#order.splice(index, 0, id);
    this.#listener.trigger("add", data, index, id);
    if(select){
      this.select(id);
    }
    return data;
  }

  /** @param {string} id */
  remove(id){
    if(this.#selected === id){
      this.unselect();
    }
    const data = this.#data.get(id);
    const index = this.#order.indexOf(id);
    this.#order.splice(index, 1);
    this.#data.delete(id);
    this.#listener.trigger("remove", data, index, id);
  }

  /**
   * @param {string} id
   * @param {(data: T) Partial<T>} predicate */
  update(id, predicate){
    const data = this.#data.get(id);
    const data_like = predicate(data);
    for(const propertyName in data_like){
      data[propertyName] = data_like[propertyName];
    }
    this.#listener.trigger("update", data, data_like, id);
  }

  /**
   * @param {string} oldId
   * @param {string} newId */
  updateId(oldId, newId){
    const data = this.#data.get(oldId);
    this.#data.delete(oldId);
    this.#data.set(newId, data);
    this.#order.splice(this.#order.indexOf(oldId), 1, newId);
    this.#listener.trigger("update-id", newId, oldId);
  }

  get [Symbol.toStringTag](){
    const types = Array.from(
      new Set([ ...this.#data.values() ]
        .map(data => data[Symbol.toStringTag] ?? typeof data))
    );
    return `DataManager<${types.length === 0 ? "any" : types.join(" | ")}>`;
  }

  static Controller = class Controller{
    /** @type {DataManager} */
    #manager = null;
    /** @param {DataManager} manager */
    attach(manager){
      if(this.#manager){
        throw "CONTROLLER_ATTACH: Can not attach a controller to more than one DataManager";
      }
      if(manager instanceof DataManager === false){
        throw "CONTROLLER_ATTACH: provided argument is not an instance of DataManager";
      }
      this.#manager = manager;
    }
    freezeSelection(){
      this.#manager.#selectionFrozen = true;
    }
    unfreezeSelection(){
      this.#manager.#selectionFrozen = false;
    }
  };

};

class User{
  #password = "";
  constructor(id = ""){
    this._id = id;
    this.name = "name";
  }
};
const ProxyUser = new Proxy(User, {
  construct(target, args, fn){
    console.log(target, args, fn);
    return new User(...args);
  }
});

// class App{
//   static #usersController = new DataManager.Controller();
//   static users = new DataManager(Number, this.#usersController);
//   static get loggedUser(){
//     return this.users.selected;
//   }
//   static load(){
//     this.#usersController.freezeSelection();
//   }
// };

// App.load();
// App.users.on("add", function(data){
//   console.log(data);
// });
// App.users.on("update", function(data, update){
//   console.log(data, update);
// });
// App.users.emplace("string", undefined, 1);
// App.users.update("number", (d) => {
//   return {};
// });