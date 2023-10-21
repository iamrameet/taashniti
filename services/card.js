class BaseItem {
  #id;
  #value;
  /**
   * @param {string} id
   * @param {number} value
   */
  constructor(id, value){
    this.#id = id;
    this.#value = value;
  }
  get id(){
    return this.#id;
  }
  get value(){
    return this.#value;
  }
  toJSON(){
    return {
      ...this,
      id: this.#id,
      value: this.#value
    };
  }
};

export default class Card extends BaseItem {
  /** @type {Player | null} */
  owner = null;
  /** @type {Player | null} */
  roundOwner = null;
  /**
   * @param {CardSuit} suit
   * @param {CardRank} rank
   * @param {string} [name]
   * @param {BaseItem["id"]} [id]
   */
  constructor(suit, rank, name, id){
    super(id ?? `${ suit.id }_${ rank.id }`, suit.value * 10 + rank.value);
    this.suit = suit;
    this.rank = rank;
    this.name = name ?? (rank.name + " of " + suit.name);
  }
};

export class CardSuit extends BaseItem {
  static color = Object.freeze({ BLACK: "black", RED: "black", ANY: "*" });
  /**
   * @param {BaseItem["id"]} id
   * @param {CardSuit.color[keyof CardSuit.color]} color
   * @param {BaseItem["value"]} value
   */
  constructor(id, color, value = 1, name = id){
    super(id, value);
    this.color = color;
    this.name = name;
  }
};

export class CardRank extends BaseItem {
  /**
   * @param {BaseItem["id"]} id
   * @param {BaseItem["value"]} value
   */
  constructor(id, value, name = id){
    super(id, value);
    this.name = name;
  }
};

/**
 * @template {BaseItem} T
 * @extends Set<T> */
export class ItemSet {

  /** @type {Map<T["id"], T>} */
  #map = new Map();
  #array;

  /** @param {readonly T[]} [values] */
  constructor(values = []){
    this.#array = values.map(value => {
      this.#map.set(value.id, value);
      return value.id;
    });
  }

  get order(){
    return Object.freeze(this.#array.slice());
  }

  get length(){
    return this.#array.length;
  }

  /** @param {T} item */
  #add(item){
    this.#map.set(item.id, item);
    this.#array.push(item);
  }

  /** @param {T} item */
  add(item){
    if(this.#map.has(item.id)){
      return;
    }
    this.#add(item);
  }

  /** @param {T["id"]} itemId */
  remove(itemId){
    const index = this.#array.indexOf(itemId);
    if(index === -1){
      return false;
    }
    this.#map.delete(itemId);
    this.#array.splice(index, 1);
  }

  clear(){
    this.#map.clear();
    this.#array = [];
  }

  /** @param {T["id"]} itemId */
  has(itemId){
    return this.#map.has(itemId);
  }

  /** @param {number} index */
  at(index){
    return this.#map.get(this.#array[index]);
  }

  /** @param {T["id"]} itemId */
  get(itemId){
    return this.#map.get(itemId);
  }

  /** @param {(item: T, index: number) => void } predicate */
  forEach(predicate){
    for(const [index, itemId] of this.#array.entries()){
      predicate(this.#map.get(itemId), index);
    }
  }

  /** @param {boolean} last When specified with `true` value, gets the last item with minimum value. Otherwise gets the first item with minimum value */
  min(last = false){
    const { length } = this.#array;
    let min = this.#map.get(this.#array[0]);
    for(let i = 1; i < length; i++){
      const item = this.#map.get(this.#array[i]);
      if(last ? item.value <= value : item.value < min.value){
        min = this.#array[i];
      }
    }
    return min;
  }

  /** @param {boolean} last When specified with `true` value, gets the last item with maximum value. Otherwise gets the first item with maximum value */
  max(last = false){
    const { length } = this.#array;
    let max = this.#map.get(this.#array[0]);
    for(let i = 1; i < length; i++){
      const item = this.#map.get(this.#array[i]);
      if(last ? item.value >= value : item.value > min.value){
        max = this.#array[i];
      }
    }
    return max;
  }

  /** @returns {Generator<[item: T, index: number], void, unknown>} */
  *each(){
    for(const [index, itemId] of this.#array.entries()){
      yield [this.#map.get(itemId), index];
    }
  }

  *[Symbol.iterator](){
    for(const item of this.#map){
      yield item[1];
    }
  }

  toJSON(){
    return [...this];
  }

  /**
   * @template {ItemSet} T
   * @param {T} itemSet
  */
  static from(itemSet){
    if(itemSet instanceof ItemSet === false){
      throw "itemSet is not an instance of ItemSet";
    }
    const instance = new this();
    for(const item of itemSet){
      instance.#add(item);
    }
    return instance;
  }

  /**
   * @template T
   * @param {ItemSet<T>} setA
   * @param {ItemSet<T>} setB
   */
  static union(setA, setB){
    return new this(Array.from(setA).concat(setB));
  }

  /**
   * @template T
   * @param {ItemSet<T>} setA
   * @param {ItemSet<T>} setB
   */
  static intersection(setA, setB){
    return new this(Array.from(setA).filter(value => setB.has(value)));
  }

  /**
   * @template T
   * @param {ItemSet<T>} setA
   * @param {ItemSet<T>} setB
   */
  static difference(setA, setB){
    return new this(Array.from(setA).filter(value => !setB.has(value)));
  }

};

/** @extends ItemSet<Card> */
export class CardSet extends ItemSet {
  constructor(...args){
    super(...args);
  }
  /** @param {CardSuit} suit */
  getCardsBySuit(suit){
    return CardSet.from(this.filter(item => item.suit === suit));
  }
  /**
   * @param {ItemSet<CardSuit>} suits
   * @param {ItemSet<CardRank>} ranks
   */
  static fromSuitsAndRanks(suits, ranks){
    const instance = new CardSet();
    for(const suit of suits){
      for(const rank of ranks){
        instance.add(new Card(suit, rank));
      }
    }
    return instance;
  }
};

export const CardSuitPreset = new ItemSet([
  new CardSuit("spade", CardSuit.color.BLACK, 1, "Spade"),
  new CardSuit("club", CardSuit.color.BLACK, 1, "Club"),
  new CardSuit("diamond", CardSuit.color.RED, 1, "Diamond"),
  new CardSuit("heart", CardSuit.color.RED, 1, "Heart")
]);

export const CardRankPreset = new ItemSet([
  new CardRank("A", 1, "Ace"),
  ...(new Array(9)).fill(0).map((_, index) => {
    const value = index + 2;
    return new CardRank(value.toString(), value, value);
  }),
  new CardRank("J", 11, "Jack"),
  new CardRank("Q", 12, "Queen"),
  new CardRank("K", 13, "King")
]);

export const CardPreset = CardSet.fromSuitsAndRanks(CardSuitPreset, CardRankPreset);
const SuitAny = new CardSuit("joker", CardSuit.color.ANY, 1);
const RankAny = new CardRank("0", 0);
CardPreset.add(new Card(SuitAny, RankAny, "Joker", "joker_1"));
CardPreset.add(new Card(SuitAny, RankAny, "Joker", "joker_2"));

const cards = CardPreset.getCardsBySuit(CardSuitPreset.get("spade"))

console.log(cards);