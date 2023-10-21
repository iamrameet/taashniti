/// <reference path="prototype-extended.d.ts"/>

HTMLElement.prototype.listen = function(eventType, decider){
  return new Promise(resolve => {

    if(typeof decider !== "function"){
      return void this.addEventListener(eventType, resolve, { once: true });
    }

    /** @type {(event: Event) => void} */
    const handler = event => {
      if(decider.call(this, event)){
        this.removeEventListener(eventType, handler);
        resolve(event);
      }
    };

    this.addEventListener(eventType, handler);

  });
}