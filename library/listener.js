import { EventEmitter } from "events";

/** @template {{ [eventName: string]: any[] }} T */
export default class Listeners{

  #emitter;
  /** @param {EventEmitterOptions} [options] */
  constructor(options){
    this.#emitter = new EventEmitter(options);
  }

  /**
   * @template {keyof T} E
   * @param {E} eventName
   * @param {(...args: T[E]) => void} handler
  */
  on(eventName, handler){
    this.#emitter.on(eventName, handler);
  }

  /**
   * @template {keyof T} E
   * @param {E} eventName
   * @param {T[E]} data
  */
  trigger(eventName, ...data){
    this.#emitter.emit(eventName, ...data);
  }

};