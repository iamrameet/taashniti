declare interface TypeOfMap {
  string: string;
  number: number;
  boolean: boolean;
  bigint: bigint;
  symbol: symbol;
  object: object;
};

declare type TypeOfKey<A extends (keyof TypeOfMap)[]> = {
  [I in keyof A]: TypeOfMap[A[I]];
};