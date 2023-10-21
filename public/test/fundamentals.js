/// <reference path="fundamentals.h.ts"/>

import Listeners from "../library/listeners.js";


const ConstructsTypeMap = {
  // expression: Expression,
  // statement: Statement
};

const ConstructsNameMap = {
  // if: IfStatement,
  // invoke: InvokeExpression
};

/**
 * @template {keyof ConstructsTypeMap} T
 * @template {keyof ConstructsNameMap} N
 */
class Construct {
  /**
   * @param {T} type
   * @param {N} Name
   * @param {ConstructsNameMap[N]} content
   */
  constructor(type, name, content){
    this.type = type;
    this.name = name;
    this.content = content;
  }
};

/** @template {Scope} S */
class Base {
  #scope;
  /** @param {S} scope */
  constructor(scope){
    this.#scope = scope;
  }
  get scope(){
    return this.#scope;
  }
};

/**
 * @template {Scope} S
 * @template {string} N
 * @template {Generator} G
 * @extends Base<S>
*/
class Expression extends Base {
  #name;
  /**
   * @param {S} scope
   * @param {N} name
   * @param {G} generator
   */
  constructor(scope, name, generator){
    super(scope);
    this.#name = name;
    this.generator = generator;
  }
  get name(){
    return this.#name;
  }
};


class Statement {};

/** @template V */
class Literal {
  /** @param {V} value */
  constructor(value){
    this.value = value;
  }
};

/** @template T */
class Variable {
  /** @param {T} type */
  constructor(type){
    this.type = type;
  }
};

const Types = {
  Number, String, Boolean, Void: null,
  Player: class Player {}
};

/**
 * @template {{ [name: string]: keyof Types }} T
 * @typedef {{ [K in T[keyof T]]: Array<{ [P in keyof T]: T[P] extends K ? P : never; }[keyof T]> }} MapByTypes */

/**
 * @template {{ [name: string]: { params: readonly (keyof Types)[]; returns: keyof Types } }} T
 * @typedef {{ [K in T[keyof T]["returns"]]: Array<{ [P in keyof T]: T[P]["returns"] extends K ? P : never }[keyof T]> }} MapByReturns */

/**
 * @template {{ [name: string]: keyof Types }} V
 * @template {{ [name: string]: { params: readonly (keyof Types | `...${keyof Types}`)[]; returns: keyof Types } }} M
 */
class Scope {

  variables;
  methods;
  /** @type {MapByTypes<V>} */
  #mappedVariables = {};
  /** @type {MapByReturns<M>} */
  #mappedMethods = {};
  /**
   * @param {V} variables
   * @param {M} methods
   */
  constructor(variables, methods){
    this.variables = variables;
    this.methods = methods;

    for(const name in variables){
      const type = variables[name];
      if(name in this.#mappedVariables === false){
        this.#mappedVariables[type] = [ name ];
      }
      this.#mappedVariables[type].push(name);
    }

    for(const name in methods){
      const method = methods[name];
      if(name in this.#mappedMethods === false){
        this.#mappedMethods[method.returns] = [ name ];
      }
      this.#mappedMethods[method.returns].push(name);
    }

    const scope = this;

    this.if = new Statement("if");
    this.invoke = new Expression(this, "invoke", function*(){
      yield scope.me
    });

    /**
     * @template {ScopesMap.global & this} S
     * @template {keyof S["methods"]} N
     * @extends {Expression<S["methods"][N]["returns"]>}
    */
    this.InvokeExpression = class InvokeExpression extends Expression {

      static #scope = scope;

      /** @param {N} name */
      constructor(name, args = []){
        this.name = name;
        this.args = args;
      }

    };

    this.IfStatement = class IfStatement extends Statement {

      #scope = scope;
      /**
       * @param {Expression<"Boolean">} condition
       * @param {(Statement | Expression<"Void">)[]} trueBody
       * @param {(Statement | Expression<"Void">)[]} falseBody
       */
      constructor(condition, trueBody, falseBody = []){
        this.condition = condition;
        this.trueBody = trueBody
        this.falseBody = falseBody;
      }
    };

  }

  /** @returns {keyof M} */
  methodNames(){
    return Object.keys(this.methods);
  }

  variables(){
    return this.#mappedVariables;
  }

  getMethod(name){
    return this.methods[name];
  }

};


const ScopesMap = {

  global: new Scope(
    {
      playerCount: "Number"
    }, {
      equals: {
        params: /** @type {const} */ ([ "Number", "Number" ]),
        returns: "Boolean"
      },
      max: {
        params: [ "Number" ],
        returns: "Number"
      },
      min: {
        params: [ "Number" ],
        returns: "Number"
      }
    }
  ),

  drop: new Scope(
    {
      playersCount: "Number",
      dealer: "Number",
      player: "Number",
      // cardSuit: "CardSuit",
      // cardRank: "CardRank",
    }, {
      nextTurn: {
        params: [ "Number" ],
        returns: "Void"
      },
      nextTurnOf: {
        params: [ "Player" ],
        returns: "Void"
      },
      skipTurn: {
        params: [],
        returns: "Void"
      }
    }
  )

};

export { ScopesMap };


const InvokeExpression = new Expression(ScopesMap.global, "invoke", function*(a, b){
  yield 10;
  return 5;
});
InvokeExpression.generator(10, 2);

/** @type {Listeners<EventListenersMap<ScopesMap>>} */
const listeners = new Listeners([ "drop" ]);

function clientMain(){
  listeners.on("drop", scope => {
    /** @type {Listeners<{ if: (statement: scope["IfStatement"]) => void; invoke: (expression: scope["InvokeExpression"]) => void }>} */
    const g = new Listeners([ "if", "invoke" ]);
    g.eventNames.forEach(name => {
      const button = createButton(name);
      button.onclick = () => g.trigger(name);
    });
    g.on("if", async If => {
      await Prompt("condition", [ ...scope.methodNames(), "?" ]);
    });
  })
  onEventSelect("drop", scope => {});
  addEvent("drop");
}

// const method = new InvokeExpression(ScopesMap.global, "Boolean", "equals",
//   new InvokeExpression(ScopesMap.global, "Number", "Number"))