declare type StructureTypes = "Number" | "String" | "Boolean" | "Void" | "Player" | "Card" | "CardSuit" | "CardRank" | "CardColor";

declare type StructureScopes = "global" | "drop" | "deal";

declare interface Structure<
  L extends StructureLiteralsMap,
  V extends StructureVariablesMap,
  M extends StructureMethodsMap
> {
  types: {
    [T in StructureTypes]: {
      info: string;
    };
  };
  scopes: StructureScopesMap<L, V, M>
}

declare type StructureScope<
  L extends StructureLiteralsMap,
  V extends StructureVariablesMap,
  M extends StructureMethodsMap
> = {
  info: string;
  literals: L;
  variables: V;
  methods: M;
};

declare interface StructureScopesMap<
  L extends StructureLiteralsMap,
  V extends StructureVariablesMap,
  M extends StructureMethodsMap
> {
  [name: string]: StructureScope<L, V, M>;
}

declare type StructureLiteral = {
  type: StructureTypes;
  info: string;
};

declare interface StructureLiteralsMap {
  [name: string]: StructureLiteral;
};

declare type StructureVariable = {
  type: StructureTypes;
  info: string;
};

declare interface StructureVariablesMap {
  [name: string]: StructureVariable;
};

declare type StructureMethod = {
  info: string;
  templates?: {
    [name: string]: StructureTypes[]
  };
  params: (StructureTypes | "T" | "U")[];
  returns: StructureTypes;
  representation: (`${ number }` | `#${ number }`)[]
};

declare interface StructureMethodsMap {
  [name: string]: StructureMethod;
}