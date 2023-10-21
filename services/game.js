import { SessionUser } from "../index.js";
import BaseMap, { BaseList } from "./base-map.js";
import { Card, CardPreset, CardRankPreset, CardMap, CardSuitPreset } from "./cards.js";

export default class Game {

  /** @type {{ [name: string]: GameEvent }} */
  events = {};
  actions = {
    playCards: new Action(this, Game.state.TURNS, this.playCards),
    pickCards: new Action(this, Game.state.TURNS, this.pickCards),
    drawCards: new Action(this, Game.state.TURNS, this.drawCards),
    swapCards: new Action(this, Game.state.TURNS, this.swapCards),
    tradeCards: new Action(this, Game.state.TURNS, this.tradeCards),
    declareCards: new Action(this, Game.state.TURNS, this.declareCards),
    passTurns: new Action(this, Game.state.TURNS, this.passTurns),
    challengePlayers: new Action(this, Game.state.TURNS, this.challengePlayers)
  };
  centerPool = new BaseList(CardPreset, { empty: true });

  /** @type {BaseMap<string, Player>} */
  players = new BaseMap();
  defaults = {
    suits: CardSuitPreset,
    ranks: CardRankPreset,
    cards: CardPreset
  };
  /** @type {Game.state[keyof Game.state]} */
  state = Game.state.WAITING;
  /** @type {string | null} */
  turn = null;
  /** @type {keyof Game["actions"] | null} */
  action = null;

  /** @param {Map<string, SessionUser>} users */
  constructor(users, rules){
    for(const [id, user] of users){
      this.players.set(id, new Player(user));
    }
    /** @type {BaseList<BaseMap<string, Card>, string, Card> | null} */
    this.cards = null;
  }

  /** @param {keyof Game["actions"]} name */
  performAction(playerId, name, data){
    if(name in this.actions === false){
      throw "Invalid action";
    }
    if(name !== this.action){
      throw "Action not allowed right now";
    }
    const action = this.actions[name];
    if(action.allowedIn & this.state === 0){
      throw "Action not allowed in current state";
    }
    if(!this.players.has(playerId)){
      throw "Invalid player ID";
    }
    if(playerId !== this.turn){
      throw "Can not perform action in another player's turn"
    }
    action.call(data);
  }

  /** @param {{ dealerId: string; cards?: string[] }} options */
  begin(options = {}){
    this.state = Game.state.SETUP;
    this.dealer = this.players.get(options.dealerId);
    const playersCount = this.players.size; // 4
    const cardsCount = this.defaults.cards.size; // 54
    const extraCards = cardsCount % playersCount; // 2
    const cardsPerPlayer = Math.floor(cardsCount / playersCount); // 13

    const cardsForGame = new BaseList(this.defaults.cards);
    cardsForGame.shuffle();

    const cardsCountInHands = (/** @type {Array<number>} */ (new Array(playersCount)))
      .fill(cardsPerPlayer, 0, playersCount - extraCards - 1)
      .fill(cardsPerPlayer + 1, playersCount - extraCards, playersCount - 1)
      .values();

    let index = 0;
    for(const player of this.players.values()){
      const result = cardsCountInHands.next();
      if(result.done){
        throw "calculations for creating player hands done wrong";
      }
      const count = result.value;
      const playerCards = cardsForGame.slice(index, index += count);
      player.setHand(playerCards);
    }
    this.events.cardsDealt.call({});
    this.state = Game.state.TURNS;
  }

  end(){}

  updatedCardsInRound = new BaseList(this.defaults.cards);

  /**
   *  @param {string} playerId
   * @param {number[]} cardIndexes
  */
  playCards(playerId, cardIndexes){
    const player = this.players.get(playerId);
    const cardsInHand = player.hand.length;
    const cardsPlayed = cardIndexes
      .filter(index => index > -1 && index < cardsInHand)
      .map(index => {
        const [ card ] = player.hand.popAt(index);
        card.owner = null;
        this.updatedCardsInRound.add(card);
        this.centerPool.add(id);
        return card;
      });
    this.events.cardsPlayed.call({ cardsPlayed, player });
  }

  /**
   *  @param {string} playerId
   * @param {number[]} cardIndexes
  */
  pickCards(playerId, cardIndexes){
    const player = this.players.get(playerId);
    const cardsInHand = player.hand.length;
    const cardsPlayed = cardIndexes
      .filter(index => index > -1 && index < cardsInHand)
      .map(index => {
        const [ card, id ] = player.hand.popAt(index);
        card.owner = null;
        this.updatedCardsInRound.add(id);
        this.centerPool.add(id);
        return card;
      });
    this.events.cardsPlayed.call({ cardsPlayed, player });
  }

  roundEnd(){
    for(const card of this.updatedCardsInRound){
      card.roundOwner = card.owner;
    }
    this.updatedCardsInRound.clear();
  }

  /** @type {(name: string, action: Action) => void} */
  addAction(name, action){
    this.actions[name] = action;
  }

  /** @param {import("../data/games/donkey.json")} object */
  static from(object, users){
    const instance = new Game(users);
    for(const eventName in object.events){
      instance.events[eventName] = new GameEvent(object.events[eventName].function, []);
    }
    return instance;
  }
};

Game.state = Object.freeze({
  /** The `WAITING` state represents the starting point of the game, where the game is waiting for players to join or waiting for a certain number of players to be present before progressing to the next state. It encompasses the initial setup and the waiting phase. */
  WAITING: 0,
  /** The `SETUP` state involves the preparation of the game, such as shuffling the deck, dealing cards to players, and any other necessary preparations before gameplay begins. */
  SETUP: 1,
  /** The `TURNS` state signifies the turn-based nature of the game, where each player takes their turn to perform actions like playing cards, making decisions, or interacting with the game state. */
  TURNS: 2,
  /** The `RESOLVING` state occurs after a player takes a turn, where any actions or effects triggered by the player's move are resolved. This can include updating scores, applying card effects, checking win conditions, or performing other game-specific actions. */
  RESOLVING: 4,
  /** The `END` state represents the conclusion of the game, where a win condition is met or a draw occurs. This state includes displaying the winner, updating statistics, and providing options for starting a new game. */
  END: 8
});

/**
 * @template {Game.state[keyof Game.state]} S
 * @template {(this: Game) => void} T
*/
class Action{
  /**
   * @param {Game} game
   * @param {S} allowedIn
   * @param {T} call
  */
  constructor(game, allowedIn, call){
    this.allowedIn = allowedIn;
    this.call = call.bind(game);
  }
}

export class Player {
  /** @param {SessionUser} user */
  constructor(user){
    this.user = user;
    /** @type {BaseList<BaseMap<string, Card>> | null}  */
    this.hand = null;
  }
  /** @param {BaseList<BaseMap<string, Card>>} baseList  */
  setHand(baseList){
    this.hand?.unregister();
    baseList.forEach(card => card.owner = this);
    this.hand = baseList;
  }
};

export class GameEvent {
  constructor(fnBody, params = []){
    this.call = new Function(fnBody, params);
  }
};