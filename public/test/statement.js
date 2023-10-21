/// <reference path="statement.h.ts"/>

/**
 * @template {keyof ScopeMap} S
*/
class StatementBuilder{

  /** @param {S} scope */
  constructor(scope){}

  /**
   * @template {keyof StatementTypeMap<ScopeMap[S]>} T
   * @template {StatementTypeMap<ScopeMap[S]>[T]} C
   * @param {T} type
   * @param {C} content
   */
  statement(type, content){
    return { type, content };
  }

  /**
   * @template {keyof (ScopeMap[S] & GlobalScope)["methods"]} N
   * @template {MethodStatement<ScopeMap[S], N>} M
   * @template {M["args"]} A
   * @param {N} name
   * @param {A} args
   */
  method(name, args = []){
    return this.statement("method", { name, args });
  }

  /**
   * @template {IfStatement<ScopeMap[S]>} I
   * @template {Operator} O
   * @template {OperationStatement<ScopeMap[S], O>} C
   * @template {I["trueBody"]} TBody
   * @template {I["falseBody"]} FBody
   * @param {C} condition
   * @param {TBody} trueBody
   * @param {FBody} falseBody
   */
  if(condition, trueBody, falseBody = []){
    return this.statement("if", { condition, trueBody, falseBody });
  }

  /**
   * @template {Operator} T
   * @template {OperationStatement<ScopeMap[S], T>} O
   * @template {O["operands"]} Op
   * @param {T} operator
   * @param {Op} operands
   */
  operation(operator, operands){
    return { operator, operands };
  }

};


/** @type {keyof ScopeMap} */
const scope = "drop";

const builder = new StatementBuilder("drop");

let statement = builder.if(
  builder.operation("===", [ "dealer", "player" ]),
  [
    builder.method("card", [ "club", "2" ])
  ],
  [
    builder.if(
      builder.operation("!", [ "isDealer" ]),
      [ builder.method("skipTurn") ],
      [ builder.method("nextTurnOf", [ "dealer" ]) ]
    )
  ]
);

/** @template {keyof ScopeMap} S */
class StatementParser {

  /** @param {S} scope */
  constructor(scope){
  }

  /** @param {ReturnType<StatementBuilder["statement"]>} statement */
  static statement({ type, ...content }){
    switch(type){
      case "if":
        return this.if(content);
      case "method":
        return this.method(content);
      default:
        return `/* Invalid statement of type '${ type }' provided. */`;
    }
  }

  /**
   * @template {IfStatement<ScopeMap[S]>} If
   * @param {If} content
  */
  static if({ condition, trueBody, falseBody }){
    return `if(${ this.method(condition) }) {
      ${
        trueBody.map(statement => this.statement(statement) + (statement.type === "method" ? ";" : "")).join(`
        `)
      }
    } ${ falseBody ? ` else {
      ${ falseBody.map(statement => this.statement(statement) + (statement.type === "method" ? ";" : "")).join(`
      `) }
    }` : "" }`;
  }

  /**
   * @template {MethodStatement<ScopeMap[S]>} M
   * @param {M} content
  */
  static method({ name, args }){
    return `${ name }(${
      args.map(statement => {
        return typeof statement === "string"
          ? statement
          : this.method(statement);
      }).join(", ")
    })`;
  }
};

const parser = new StatementParser("drop");

parser.statement(statement);

// deal
// hand 1 dealt
// hand 2 dealt
// hand 3

async function main(){

  let isGameRunning = true;
  let players = getPlayers();
  let dealer = players[0];

  dealCards();

  const timeout = 30 * 1000; // 30s
  // while(isGameRunning){
  //   await playerAction(timeout);
  // }

}