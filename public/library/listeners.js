/** @template {{ [eventName: string]: (...args: any) boolean | Promise<boolean> }} EventMap */
export default class Listeners{
  /** @type {{[eventName in keyof EventMap]: { eventName: eventName, actions:{ type: "on" | "once", handler: EventMap[eventName] }[]}}}*/
  #listeners = {};
  /** @param {[keyof EventMap]} eventsNames */
  constructor(eventsNames){
    eventsNames.forEach(eventName => this.add(eventName));
  }
  /** returns an array of registered events
   * @returns {(keyof EventMap)[]} */
  get eventNames(){
    return Object.keys(this.#listeners);
  }
  /** boolean indicating whether the specified event has listeners or not
   * @param {keyof EventMap} eventName */
  has(eventName){
    return eventName in this.#listeners && this.#listeners[eventName].actions.length > 0;
  }
  /** adds the specified event as a listener
   * @param {keyof EventMap} eventName */
  add(eventName){
    this.#listeners[eventName] = { eventName, actions: [] };
  }
  /**
   * @template {keyof EventMap} E
   * @param {E} eventName
   * @param {EventMap[E]} handler */
  on(eventName, handler){
    if(!this.#listeners[eventName]){
      throw Error("ERR_INVALID_EVENT: '" + eventName + "' is not added as a listener");
    }
    this.#listeners[eventName].actions.push({ handler, type: "on" });
    return this;
  }
  /**
   * @template {keyof EventMap} E
   * @param {E} eventName
   * @param {EventMap[E]} handler */
  once(eventName, handler){
    if(!this.#listeners[eventName]){
      throw Error("ERR_INVALID_EVENT: '" + eventName + "' is not added as a listener");
    }
    this.#listeners[eventName].actions.push({ handler, type: "once" });
    return this;
  }
  /**
   * @template {keyof EventMap} E
   * @param {E} eventName
   * @param {EventMap[E]} handler */
  off(eventName, handler){
    if(!this.#listeners[eventName]){
      throw Error("ERR_INVALID_EVENT: '" + eventName + "' is not added as a listener");
    }
    const index = this.#listeners[eventName].actions.findIndex(action => action.handler === handler);
    if(index === -1){
      return false;
    }
    this.#listeners[eventName].actions.splice(index, 1);
    return true;
  }
  /**
   * @template {keyof EventMap} E
   * @param {E} eventName
   * @param {Parameters<EventMap[E]>} response */
  async trigger(eventName, ...response){
    if(eventName in this.#listeners){
      const { actions } = this.#listeners[eventName];
      for(let index = 0; index < actions.length; index++){
        const action = actions[index];
        const allowNext = await action.handler(...response);
        if(allowNext === false){
          break;
        }
        if(action.type === "once"){
          actions.splice(index--, 1);
        }
      }
    }
  }
  /**
   * @template {keyof EventMap} E
   * @param {E} eventName
   */
  count(eventName){
    return this.#listeners[eventName]?.actions.length ?? 0
  }
};