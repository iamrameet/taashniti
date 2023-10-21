/**
 * @template {Record<T, string>} T
 * @param {T} args
*/
export function Enum(...args){
  /** @type {{ [key in T[number]]: symbol }} */
  const object = {};
  for(const num of args){
    object[num] = Symbol();
  }
  return Object.freeze(object);
}