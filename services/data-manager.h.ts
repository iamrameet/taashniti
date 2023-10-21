interface DataManagerListeners<T>{
  select(data: T, id: string): void;
  unselect(data: T, id: string): void;
  change(currentData: T, currentId: string, previousData: T, previousId: string): void;
  add(data: T, index: number, id: string): void;
  remove(data: T, index: number, id: string): void;
  update(data: T, updatedFields: {[key in keyof T]: T[key]}, id: string): void;
  "update-id"(newId: string, oldId: string): void;
}