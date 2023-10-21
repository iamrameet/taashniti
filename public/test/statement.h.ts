interface OperatorMap {
  "===": { type: "bi" };
  "!==": { type: "bi" };
  ">=": { type: "bi" };
  "<=": { type: "bi" };
  ">": { type: "bi" };
  "<": { type: "bi" };
  "!": { type: "uni" };
};

type Operator = keyof OperatorMap;

interface Constant {};
interface Variable extends Constant {
  [variable: string]: any
};
interface MethodName extends Constant {
  [name: string]: {
    params: any[]
  }
};

interface Scope {
  variables: Variable;
  methods: {
    [name: string]: { params: any[] }
  };
};

interface BaseStatement<S extends Scope, T extends keyof StatementTypeMap<S> = keyof StatementTypeMap<S>> {
  type: T;
  content: StatementTypeMap<S>[T]
};

type GlobalOrLocal<S extends Scope> = S & GlobalScope;

type Operation<S extends Scope, O extends Operator = Operator> = {
  operator: O;
  operands: OperatorMap[O]["type"] extends "bi"
    ? [ Operand<S>, Operand<S> ]
    : [ Operand<S> ]
};

type Operand<S extends Scope> = keyof GlobalOrLocal<S>["variables"] | BaseStatement<S>;

interface IfStatement<S extends Scope> {
  condition: Operation<S>;
  trueBody: BaseStatement<S>[];
  falseBody?: BaseStatement<S>[];
};

interface MethodStatement<
  S extends Scope,
  N extends keyof (S & GlobalScope)["methods"] = keyof (S & GlobalScope)["methods"]
> {
  name: N;
  args: (
    N extends keyof S["methods"]
      ? S["methods"][N]["params"]
      : N extends keyof GlobalScope["methods"]
        ? GlobalScope["methods"][N]["params"]
        : never
  ) | BaseStatement<S>[];
};

interface StatementTypeMap<S extends Scope> {
  if: IfStatement<S>;
  method: MethodStatement<S>;
};

interface CardIdMap {
  "spade1": { suit: "spade", rank: "1", color: "black" };
  "heartK": { suit: "spade", rank: "King", color: "black" };
};

type CardSuit = "heart" | "diamond" | "spade" | "club";
type CardRank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
type CardId = `${ CardSuit }${ CardRank }`;
type CardColor = "black" | "red";

interface GlobalScope extends Scope {
  variables: {
    isDealer: boolean;
  };
  methods: {
    maxInCards: { params: CardId[], returns: CardId };
    card: { params: [ CardSuit, CardRank ], returns: CardId };
  }
};

interface DropScope extends Scope {
  variables: {
    playersCount: number;
    dealer: number;
    player: number;
    cardSuit: CardSuit;
    cardRank: CardRank;
  };
  methods: {
    nextTurn: { params: [ `+${ number }` | `-${ number }` | 0 | number ]};
    nextTurnOf: { params: [ "player" | "dealer" ] };
    skipTurn: { params: [] }
  }
};

interface DealScope extends Scope {
  variables: {
    playersCount: number;
    dealer: number;
    player: number;
    deal: number;
    dealtCount: number;
    cardSuit: CardSuit;
    cardRank: CardRank;
  };
  methods: {
  }
};

interface ScopeMap {
  drop: DropScope;
  deal: DealScope;
};

interface DealRules {
  playersCount: number;
  cardsPerPlayer: number | number[];
};

interface AMap {
  alpha: "a" | "b" | "c";
  beta: "x" | "y";
  gamma: "p" | "q" | "r";
};

type AType<T extends keyof AMap = keyof AMap> = {
  type: T;
  content: T extends "alpha" ? AMap["alpha"] : T extends "beta" ? AMap["beta"] : T extends "gamma" ? AMap["gamma"] : never;
  sub?: ReturnType<typeof ATypeBuild<keyof AMap>>
};

declare function ATypeBuild<T extends keyof AMap>(obj: AType<T>): AType<T>;

ATypeBuild({
  type: "alpha",
  content: "b",
  sub: {
    type: "beta",
    content: "x"
  }
})