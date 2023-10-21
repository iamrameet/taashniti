/// <reference path="../helper/structure.h.ts"/>

export default class StructureScopeParser {

  #structure;
  /** @type {{ [scopeName: string]: { [type in StructureTypes]: { scope: string; collection: "literals" | "variables" | "methods"; name: string; info: string; type: type; params?: StructureMethod["params"] }[] } }} */
  #typesMap = {};

  /** @param {Structure<StructureLiteralsMap, StructureVariablesMap, StructureMethodsMap>} structure */
  constructor(structure){
    this.#structure = structure;
    for(const scopeName in structure.scopes){
      this.#typesMap[scopeName] = {};
      this.#assignTypesMap(scopeName);
    }
  }

  getTypesMap(scopeName){
    return this.#typesMap[scopeName];
  }

  /** @param {StructureTypes[]} types */
  getMethod(scopeName, methodName, returnType){
    const method = this.#structure.scopes[scopeName].methods[methodName];
    if(method.returns in (method.templates ?? {})){
      for(const type of method.templates[method.returns]){
        if(type === returnType){
          return {
            ...method,
            params: method.params.map(param => param === method.returns ? type : param)
          };
        }
      }
    }
    return method;
  }

  #assignTypesMap(scopeName){
    this.#assignTypesMapFrom(scopeName, scopeName, "variables");
    this.#assignTypesMapFrom(scopeName, scopeName, "literals");
    this.#assignTypesMapMethods(scopeName, scopeName);
    this.#assignTypesMapFrom(scopeName, "global", "variables");
    this.#assignTypesMapFrom(scopeName, "global", "literals");
    this.#assignTypesMapMethods(scopeName, "global");
  }

  /**
   * @param {string} scopeName
   * @param {"variables" | "literals"} collectionName
  */
  #assignTypesMapFrom(assignedScope, scopeName, collectionName){
    const collection = this.#structure.scopes[scopeName][collectionName];
    for(const name in collection){
      const { type, info } = collection[name];
      const object = { name, type, info, scope: scopeName, collection: collectionName };
      if(type in this.#typesMap[assignedScope] === false){
        this.#typesMap[assignedScope][type] = [ object ];
        continue;
      }
      this.#typesMap[assignedScope][type].push(object);
    }
  }

  /** @param {string} scopeName */
  #assignTypesMapMethods(assignedScope, scopeName){
    const { methods } = this.#structure.scopes[scopeName];
    for(const name in methods){
      const { info, returns, params, templates = {} } = methods[name];
      let types = [ returns ];
      if(returns in templates){
        types = templates[returns];
      }
      for(const type of types){
        const object = { name, type, info, scope: scopeName, collection: "methods",
          params: params.map(param => param === returns ? type : param)
        };
        if(type in this.#typesMap[assignedScope] === false){
          this.#typesMap[assignedScope][type] = [ object ];
          continue;
        }
        this.#typesMap[assignedScope][type].push(object);
      }
    }
  }

};