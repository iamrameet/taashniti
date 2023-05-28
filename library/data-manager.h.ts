import FileInfo from "../server/entities/file-info";
import { Manageable } from "./data-manager";

declare interface DataTypesMap {
  number: {
    type: number,
    length: 17,
  },
  float: {
    type: number,
    length: 27
  }
};

declare type FileDataFormat = {
  properties: {
    a: { type: number, size: 10 },
    b: 20,
    c: 30
  }
};

enum StructuredFileSelect {
  NONE = 0,
  ALL = 1
};

declare type StructuredFileSelectOption<T, S extends StructuredFileSelect> = {
  select: S
} & (
  S extends StructuredFileSelect.ALL
  ? { except?: (keyof T)[] }
  : { except: (keyof T)[] }
);

declare class StructuredFile<T>{

  constructor(filepath: string);

  add(data: T): Promise<T>;

  removeById(): Promise<boolean>;

  get<S extends StructuredFileSelect>(id: string, select?: StructuredFileSelectOption<T, S>): Promise<T>;

  findAnyBy<P extends keyof T, S extends StructuredFileSelect>(property: P, select?: StructuredFileSelectOption<T, S>): Promise<T | undefined>;

  findEveryBy<P extends keyof T, S extends StructuredFileSelect>(property: P, select?: StructuredFileSelectOption<T, S>): Promise<T[]>;

};

declare class Vector2{
  x: number;
  y: number;
  constructor(x: number, y: number);
};

let file = new StructuredFile<Vector2>("path.txt");
file.get("x", {
  select: StructuredFileSelect.NONE,
  except: ["x", "y"]
});
const vector2 = file.findAnyBy("x", { select: StructuredFileSelect.ALL });

const fileData =`column 1 datacolumn 2 data`;