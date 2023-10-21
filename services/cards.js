import BaseMap, { BaseList } from "./base-map.js";

export class CardSuit {
  static color = Object.freeze({ BLACK: "black", RED: "red", ANY: "*" });
  /**
   * @param {string} name
   * @param {CardSuit.color[keyof CardSuit.color]} color
   * @param {number} value
   */
  constructor(name, color, value = 1){
    this.name = name;
    this.color = color;
    this.value = value;
  }
};

export class CardRank {
  /**
   * @param {string} name
   * @param {BaseItem["value"]} value
   */
  constructor(name, value){
    this.name = name;
    this.value = value;
  }
};

export class Card {
  /** @type {Player | null} */
  owner = null;
  /** @type {Player | null} */
  roundOwner = null;
  /**
   * @param {CardSuit} suit
   * @param {CardRank} rank
   * @param {string} [name]
   */
  constructor(suit, rank, name){
    this.suit = suit;
    this.rank = rank;
    this.value = suit.value * 10 + rank.value;
    this.name = name ?? (rank.name + " of " + suit.name + "s");
  }
};

/** @extends {BaseMap<string, Card>} */
export class CardMap extends BaseMap {
  constructor(...args){
    super(...args);
  }

  /** @param {CardSuit} suit */
  getCardsBySuit(suit){
    return CardMap.from(this.filter(item => item.suit === suit));
  }

  /**
   * @param {BaseMap<string, CardSuit>} suits
   * @param {BaseMap<string, CardRank>} ranks
   */
  static fromSuitsAndRanks(suits, ranks){
    /** @type {BaseMap<string, Card>} */
    const instance = new BaseMap();
    for(const [suitId, suit] of suits){
      for(const [rankId, rank] of ranks){
        instance.set(suitId + "_" + rankId, new Card(suit, rank));
      }
    }
    return instance;
  }

};

export const CardSuitPreset = new BaseMap([
  [ /** @type {const} */ ("spade"), new CardSuit("Spade", CardSuit.color.BLACK) ],
  [ /** @type {const} */ ("heart"), new CardSuit("Heart", CardSuit.color.RED) ],
  [ /** @type {const} */ ("club"), new CardSuit("Club", CardSuit.color.BLACK) ],
  [ /** @type {const} */ ("diamond"), new CardSuit("Diamond", CardSuit.color.RED) ],
]);

/** @type {BaseMap<"1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A", CardRank>} */
export const CardRankPreset = new BaseMap([
  [ "A", new CardRank("Ace", 1) ],
  ...(new Array(9)).fill(0).map((_, index) => {
    const value = index + 2;
    const name = value.toString();
    return [ name, new CardRank(name, value) ];
  }),
  [ "J", new CardRank("Jack", 11) ],
  [ "Q", new CardRank("Queen", 12) ],
  [ "K", new CardRank("King", 13) ]
]);

export const CardPreset = CardMap.fromSuitsAndRanks(CardSuitPreset, CardRankPreset);
const JokerSuit = new CardSuit("Joker", "*", 1);
const JokerRank = new CardRank("Joker", 0);
CardPreset.set("joker1", new Card(JokerSuit, JokerRank, "Joker"));
CardPreset.set("joker2", new Card(JokerSuit, JokerRank, "Joker"));