import "../library/array.js";

/**
 * @template K
 * @template T
 * @extends {Map<K, T>}
 */
export default class BaseMap extends Map {

  #registry = new FinalizationRegistry(key => this.unregister(key));
  /** @type {Map<symbol, InstanceType<typeof BaseMap.BaseList<K, T>>>} */
  #lists = new Map();

  /** @param {[K, T][]} args */
  constructor(args){
    super(args);
  }

  /** @param {K} key */
  delete(key){
    if(!super.delete(key)){
      return false;
    }
    for(const list of this.#lists.values()){
      list.remove(key);
    }
  }

  clear(){
    for(const list of this.#lists.values()){
      list.clear();
    }
    super.clear();
  }

  /** @param {BaseList<K, T>} baseList */
  register(baseList){
    if(baseList.isRegistered){
      throw "BaseList already registered";
    }
    const registerKey = Symbol();
    this.#registry.register(baseList, registerKey, baseList);
    this.#lists.set(registerKey, baseList);
    return registerKey;
  }

  unregister(key){
    const baseList = this.#lists.get(key);
    this.#registry.unregister(baseList);
    return this.#lists.delete(key);
  }

};

/**
 * @template {BaseMap<K, T>} M
 * @template [K=M extends BaseMap<infer Key, any> ? Key : never}]
 * @template [T=M extends BaseMap<any, infer Value> ? Value : never}]
 * */
export class BaseList {

  /** @type {M | null} */
  #baseMap;
  /** @type {K[]} */
  #array = [];
  #registeredKey = null;

  /**
   * @param {M} baseMap
   * @param {K[]} [keys]
  */
  constructor(baseMap, keys = []){
    if(baseMap instanceof BaseMap === false){
      throw "first argument must be a type of BaseMap";
    }
    this.#baseMap = baseMap;
    this.#registeredKey = baseMap.register(this);
    for(const key of keys){
      this.add(key);
    }
  }

  get length(){
    return this.#array.length;
  }

  get isRegistered(){
    return this.#registeredKey !== null;
  }

  shuffle(){
    this.#array.shuffle();
    return this;
  }

  /**
   * @param {number} [start]
   * @param {number} [end]
   */
  slice(start, end){
    return new BaseList(this.#baseMap, this.#array.slice(start, end));
  }

  register(){
    this.#registeredKey = this.#baseMap.register(this);
  }
  unregister(){
    this.#baseMap.unregister(this.#registeredKey);
    this.#registeredKey = null;
  }

  /** @param {K} key */
  add(key){
    if(this.#baseMap.has(key) && this.#array.indexOf(key) === -1){
      this.#array.push(key);
    }
  }

  /** @param {K} key */
  remove(key){
    const index = this.#array.indexOf(key);
    if(index === -1){
      return false;
    }
    this.#array.splice(index, 1);
    return true;
  }

  has(){
    return this.#array.includes(key);
  }

  /** @param {number} index */
  at(index){
    return this.#baseMap.get(this.#array[index]);
  }
  /** @param {number} index */
  keyAt(index){
    return this.#array[index];
  }

  /** @param {number} index */
  popAt(index){
    if(index < 0 || index >= this.#array.length){
      return [];
    }
    const key = this.#array.splice(index, 1)[0];
    return /** @type {const} */ ([ this.#baseMap.get(key), key ]);
  }

  clear(){
    this.#array = [];
  }

  /** @param {(value: T, key: K, index: number) => void} predicate */
  forEach(predicate){
    for(const [index, key] of this.#array.entries()){
      predicate(this.#baseMap.get(key), key, index);
    }
  }

  *[Symbol.iterator](){
    for(const element of this.#array){
      yield /** @type {T} */ (this.#baseMap.get(element) );
    }
  }
  *keys(){
    for(const element of this.#array){
      yield /** @type {K} */ (element);
    }
  }
  *entries(){
    for(const element of this.#array){
      yield /** @type {[key: K, item: T]} */ ([ element, this.#baseMap.get(element) ]);
    }
  }

};

/** @type {BaseMap<string, { x: number; y: number; }>} */
const map = new BaseMap();
map.set("p", { x: 10, y: 20 });
map.set("q", { x: 10, y: 80 });
map.set("r", { x: 50, y: 60 });

const list = new BaseList(map);
const list2 = new BaseList(map);
// list.remove("p");
// list.remove("r");
// list.add("l");
map.delete("q");
list.unregister();

console.log("map", ...map);
console.log("list", ...list);
console.log("list2", ...list2);