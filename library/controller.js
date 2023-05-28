import Logger from "./logger.js";

/** @typedef {Parameters<import("express").RequestHandler>} RHParams */
/**
 * @template {string} T
 * @typedef {{ [endPoint: string]: (params: { request: RHParams[0], response: RHParams[1], next: RHParams[2] }, options: { setFailureCode: (code: number) => void, logger: Logger<`CONTROLLER_${T}`> }) => void }} RequestHandlers */
/**
 * @template T
 * @typedef { {} extends T ? never : T } isMethodDefined */

class ExpressController{

  /**
   * @template {string} N
   * @template {RequestHandlers<N>} GET
   * @template {RequestHandlers<N>} POST
   * @template {RequestHandlers<N>} PUT
   * @template {RequestHandlers<N>} DELETE
   * @param {{ get?: GET, post?: POST, put?: PUT, delete?: DELETE }} object
   * @param {N} controllerName
   * @param {{ failureCode?: number }} options
   * @returns {{ get: isMethodDefined<GET>, post: isMethodDefined<POST>, put: isMethodDefined<PUT>, delete: isMethodDefined<DELETE> }}
   */
  static handleWithJSON(controllerName, object, options = {}){

    const logger = new Logger(`CONTROLLER_${controllerName}`);

    for(const method in object){
      for(const path in object[method]){
        /** @type {RequestHandlers<N>[string]} */
        const handler = object[method][path];

        object[method][path] = async function(request, response, next){
          let failureCode = options?.failureCode ?? 500;
          try {
            const data = await handler({ request, response, next }, {
              setFailureCode(code){
                failureCode = code;
              },
              logger
            });
            response.status(200).json(data);
          } catch(reason) {
            logger.error(reason);
            response.status(failureCode).json({ reason });
          }
        };

      }
    }
    return object;

  }

  /**
   * @template {Object<string, import("express").RequestHandler>} O
   * @param {O} object */
  static object(object){
    return object;
  }
};

export default ExpressController;