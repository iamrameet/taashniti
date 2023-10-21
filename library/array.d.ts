declare interface Array<T> {
  shuffle(): T[];

  /** Changes all array elements from the start to end index to a value returned from the evaluator function and returns the modified array.
  * @param evaluator - A function to fill the array section with the returned value. The evaluator function is called once for each section in the array specified by the start and end range.
  * @param {number} [start] - The index to start filling the array at. If the start parameter is negative, it is treated as `length + start`, where length is the length of the array.
  * @param {number} [end] - The index to stop filling the array at. If the end parameter is negative, it is treated as `length + end`, where length is the length of the array.
  */
  fill(evaluator: (index: number, element: T | undefined) => T, start?: number | undefined, end?: number | undefined): T[];
}