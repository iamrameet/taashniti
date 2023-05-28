import fs from "node:fs/promises";
import Logger from "./logger.js";
import path from "node:path";

/** @typedef {{[key in Field.types[number]]: key}} FieldTypeMap */
/** @typedef {{string: string, number: number, boolean: boolean}} FieldPrimitiveTypeMap */
/**
 * @template {FieldPrimitiveTypeMap[P]} T
 * @template {keyof FieldTypeMap} P
 */
export class Field{
  static #types = /** @type {const} */(["string", "number", "boolean"]);
  #validator;
  #unique;
  #required;
  #primitiveType;
  #defaultValue;
  #reassignable;
  #validationHelp;
  /**
   * @param {{ unique:? boolean, required:? boolean, reassignable:? boolean, primitiveType:? P, defaultValue:? FieldPrimitiveTypeMap[P], validator: null | (value: T, name: string) boolean, validationHelp:? string }} options
   */
  constructor(options = {}){

    if("validator" in options && options.validator !== null && typeof options.validator !== "function"){
      throw "'validator' option expects either a function or null when specified";
    }

    if("unique" in options && typeof options.unique !== "boolean"){
      throw "'unique' option expects a boolean value when specified";
    }

    if("required" in options && typeof options.required !== "boolean"){
      throw "'required' option expects a boolean value when specified";
    }

    if("reassignable" in options && typeof options.reassignable !== "boolean"){
      throw "'reassignable' option expects a boolean value when specified";
    }

    if("primitiveType" in options && !Field.#types.includes(options.primitiveType)){
      throw "'primitiveType' options expects a primitive type";
    }

    if("defaultValue" in options && typeof options.defaultValue !== options.primitiveType){
      throw "'defaultValue' option's value must match the specified primitive type";
    }

    if("validationHelp" in options && typeof options.validationHelp !== "string"){
      throw "'validationHelp' option expects a string value when specified";
    }

    this.#validator = options.validator ?? null;
    this.#unique = options.unique ?? false;
    this.#required = options.required ?? false;
    this.#reassignable = options.reassignable ?? true;
    this.#primitiveType = options.primitiveType ?? null;
    this.#defaultValue = options.defaultValue ?? null;
    this.#validationHelp = options.validationHelp ?? null;
  }
  get isUnique(){
    return this.#unique;
  }
  get isRequired(){
    return this.#required;
  }
  get isReassignable(){
    return this.#reassignable;
  }
  get primitiveType(){
    return this.#primitiveType;
  }
  get defaultValue(){
    return this.#defaultValue;
  }
  get validationHelp(){
    return this.#validationHelp;
  }
  /** @param {T} data */
  isValid(data){
    if(data === null || data === undefined){ // empty data
      if(this.#required){ // should not be empty
        return false;
      }
      return true;
    }
    if(this.#primitiveType !== null && typeof data !== this.#primitiveType){
      return false;
    }
    if(this.#validator !== null){
      try{
        return this.#validator(data);
      }catch(ex){
        console.trace(ex);
        return false;
      }
    }
    return true;
  }
  /** @param {T} data */
  try(data, fieldName){
    if(data === null || data === undefined){ // empty data
      if(this.#required){ // should not be empty
        throw "REQUIRED";
      }
      return;
    }
    if(this.#primitiveType !== null && typeof data !== this.#primitiveType){
      throw "TYPE_MISMATCH";
    }
    if(this.#validator !== null){
      return this.#validator(data, fieldName);
    }
  }
  static get types(){
    return this.#types;
  }
};

/** @template {} T extends Manageable */
export class FieldsValidator{
  #from;
  /** @type {{[fieldName in keyof T]: Field<T[fieldName]>}} */
  #fields = {};
  /** @type {{ [fieldName in keyof T]: (this: T, value: T[fieldName]) => void }} */
  #setters = {};
  /**
   * @param {string} id
   * @param {(object: { [fieldName in keyof T]: T[fieldName] }) T} from
   * @param {{ [fieldName in keyof T]: Field<T[fieldName]> }} fields
   * @param {{ [fieldName in keyof T]: (this: T, value: T[fieldName]) => void }} setters
   */
  constructor(from, fields, setters = {}){
    this.#from = from;

    for(const fieldName in fields){
      if(fields[fieldName] instanceof Field === false){
        throw "field must be an instance of Field";
      }
      this.#fields[fieldName] = fields[fieldName];
      this.#setters[fieldName] = fieldName in setters ? setters[fieldName] : function(value){
        this[fieldName] = value;
      };
    }

  }

  /** @returns {Generator<[fieldName: keyof T, Field<T[fieldName]>], void, unknown>} */
  *uniqueFields(){
    for(const entry of Object.entries(this.#fields)){
      if(entry[1].isUnique){
        yield entry;
      }
    }
  }

  /** @param {keyof T} fieldName */
  hasField(fieldName){
    return fieldName in this.#fields;
  }
  /** @param {keyof T} fieldName */
  getField(fieldName){
    return this.#fields[fieldName];
  }

  /**
   * @param {keyof T} fieldName
   * @param {T[fieldName]} value */
  testField(fieldName, value){
    if(fieldName in this.#fields === false){
      return false;
    }
    return this.#fields[fieldName].isValid(value);
  }

  /** @param {T} object */
  test(object){
    for(const fieldName in this.#fields){
      const field = this.#fields[fieldName];
      if(!field.isValid(object[fieldName]))
        return false;
    }
    return true;
  }

  /** @param {{[fieldName in keyof T]: T[fieldName]}} object */
  validObject(object){
    /** @type {T} */
    const validObject = {};
    for(const fieldName in this.#fields){
      const field = this.#fields[fieldName];
      try{
        field.try(object[fieldName]);
        validObject[fieldName] = object[fieldName] ?? this.#fields[fieldName].defaultValue;
      }
      catch(ex){
        switch(ex){
          case "REQUIRED": throw `'${fieldName}' is required`;
          case "TYPE_MISMATCH": throw `'${object[fieldName]}' is invalid value for field '${fieldName}'`;
          default: throw field.validationHelp ?? ex;
        }
      }
    }
    return this.#from(validObject);
  }

  /**
   * @param {T} instance
   * @param {{[fieldName in keyof T]: T[fieldName]}} object */
  assign(instance, object){
    for(const fieldName in object){
      const isValidData = this.testField(fieldName, object[fieldName]);
      if(!isValidData){
        throw `invalid data '${object[fieldName]}' provided to field '${fieldName}'`;
      }
      this.#setters[fieldName].call(instance, object[fieldName]);
    }
  }

};

export class Manageable{
  #id;
  /** @param {string} id */
  constructor(id){
    if(!id || typeof id !== "string"){
      throw "Manageable object 'id' must be a valid string";
    }
    this.#id = id;
    // if("id" in fields){
    //   throw "field 'id' is not an assignable field of Manageable type";
    // }
  }
  get id(){
    return this.#id;
  }
  toObject(){
    return { ...this, id: this.#id };
  }
};

export class AsyncQueue{
  /** @type {(() Promise)[]} */
  #queue = [];
  get isEmpty(){
    return this.#queue.length === 0;
  }
  /** @param {() Promise} action */
  enqueue(action, identifier){
    action.identifier = identifier;
    console.log("quequed:", action.identifier);
    this.#queue.push(action);
    if(this.#queue[0] === action){
      this.#dequeue();
    }
  }
  async #dequeue(){
    if(this.isEmpty){
      return null;
    }
    console.log("dequequing:", this.#queue[0].identifier);
    await this.#queue[0]();
    this.#queue.shift();
    await this.#dequeue();
  }
};

/** @template {Manageable} T */
export default class DataManager{
  #filePath;
  /** @type {import("node:fs/promises").FileHandle | null} */
  #fileHandle = null;
  #validator;
  /** @type {Map<string, T>} */
  #data = new Map();
  #requestQueue = new AsyncQueue();
  /**
   * @param {string} filePath
   * @param {FieldsValidator<T>} validator
   */
  constructor(filePath, validator){
    this.#filePath = filePath;
    this.#validator = validator;
  }

  async #createDir(){
    const dirPath = path.dirname(this.#filePath);
    return await fs.mkdir(dirPath, { recursive: true });
  }

  async _open(options = { createDir: false }){
    try {
      if(options?.createDir){
        await this.#createDir();
      }
      this.#fileHandle = await fs.open(this.#filePath, "a+");
      this.#load();
    } catch(ex) {
      Logger.error("DATA_MANAGER", ex);
      throw "Unable to open file";
    }
  }

  async _close(){
    if(!this.#fileHandle){
      return;
    }
    const stat = await fs.stat(this.#filePath).catch(console.log);
    if(!stat?.isFile()){
      await fs.writeFile(this.#filePath, this.stringify(), { encoding: "utf-8" });
    }
    await this.#fileHandle.close();
    this.#fileHandle = null;
  }

  get _isOpen(){
    return this.#fileHandle !== null;
  }

  #throwIfNotOpen(fn){
    if(this.#fileHandle === null){
      const error = "DataManager must pe opened in order to use it";
      if(typeof fn === "function"){
        return void fn(error);
      }
      throw error;
    }
  }

  stringify(){
    const data = Object.fromEntries(this.#data);
    for(const id in data){
      data[id] = data[id].toObject();
    }
    return JSON.stringify(data);
  }

  /** @param {string} id */
  has(id){
    return this.#data.has(id);
  }
  /** @param {string} id */
  get(id){
    if(this.#data.has(id)){
      return this.#data.get(id);
    }
    return null;
  }
  /** @param {{[id in keyof T]: T[id]}} object */
  find(object){
    for(const manageable of this.#data.values()){
      let found = manageable;
      for(const fieldName in object){
        if(fieldName in manageable === false || manageable[fieldName] !== object[fieldName]){
          found = null;
          break;
        }
      }
      if(found !== null){
        return found;
      }
    }
    return null;
  }
  /** @param {{[id in keyof T]: T[id]}} object */
  findAny(object){
    for(const manageable of this.#data.values()){
      for(const fieldName in object){
        if(fieldName in manageable && manageable[fieldName] === object[fieldName])
          return manageable;
      }
    }
    return null;
  }

  /** @param {{[id in keyof T]: T[id]}} object */
  findFieldAny(object){
    for(const manageable of this.#data.values()){
      for(const fieldName in object){
        if(fieldName in manageable && manageable[fieldName] === object[fieldName])
          return fieldName;
      }
    }
    return null;
  }

  /**
   * @param {T} object
   * @return {Promise<T>} */
  async add(object){
    return await new Promise((resolve, reject) => {
      this.#requestQueue.enqueue(async () => {
        const id = this.generateId();
        try{
          const objectToFind = {};
          for(const [fieldName] of this.#validator.uniqueFields()){
            if(fieldName in object){
              objectToFind[fieldName] = object[fieldName];
            }
          }
          const foundField = this.findFieldAny(objectToFind);
          if(foundField){
            throw `'DataManager.add()': duplicate entry found for field '${foundField}'`;
          }
          const validObject = this.#validator.validObject({ ...object, id });
          this.#data.set(id, validObject);
          await this.save();
          return void resolve(validObject.toObject());
        }
        catch(ex){
          return void reject(ex);
        }
      }, "ADD");
    });
  }

  async remove(id){
    return await new Promise((resolve, reject) => {
      this.#requestQueue.enqueue(async () => {
        if(this.#data.has(id)){
          this.#data.delete(id);
          await this.save();
          return void resolve();
        }
        return void reject(`no manageable object found with specified Id '${id}'`);
      }, "REMOVE");
    });
  }

  /**
   * @virtual
   * @param {string} id
   * @param {{[key in keyof T]: T[key]}} object
  */
  async update(id, object){
    return await new Promise((resolve, reject) => {
      this.#requestQueue.enqueue(async () => {
        const manageable = this.#data.get(id);
        if(manageable){
          if("id" in object){
            return void reject("cannot update Id of manageable object.");
          }

          const validData = {};
          for(const fieldName in object){
            const field = this.#validator.getField(fieldName);
            const isValidData = this.#validator.testField(fieldName, object[fieldName]);
            if(!isValidData){
              return void reject(`invalid data '${object[fieldName]}' provided to field '${fieldName}'`);
            }
            validData[fieldName] = object[fieldName] ?? field.defaultValue;
          }
          const objectToFind = {};
          for(const [fieldName] of this.#validator.uniqueFields()){
            if(fieldName in object){
              objectToFind[fieldName] = object[fieldName];
            }
          }
          const foundField = this.findFieldAny(objectToFind);
          if(foundField){
            return void reject(`'DataManager.update()': duplicate entry found for field '${foundField}'`);
          }
          this.#validator.assign(manageable, validData);
          // for(const fieldName in validData){
          //   manageable[fieldName] = validData[fieldName];
          // }
          await this.save();
          return void resolve();
        }
        return void reject(`no manageable object found with specified Id '${id}'`);
      }, "UPDATE");
    });
  }

  async #load(){
    try {
      const fileContent = await fs.readFile(this.#filePath, { encoding: "utf-8" });
      this.#data = this.#filterData(JSON.parse(fileContent));
    } catch(ex) {
      Logger.error("DATA_MANAGER", "LOAD", ex);
    }
  }

  async load(){
    // this.#throwIfNotOpen();
    const fileStat = await fs.stat(this.#filePath).catch(console.log);
    if(fileStat) {
      this.#load();
    } else await this.save();
  }

  /** @returns {Promise<Map<string, T>>} */
  async save(){
    return new Promise(async (resolve, reject) => {
      // this.#throwIfNotOpen(reject);
      fs.writeFile(this.#filePath, this.stringify(), {
        encoding: "utf-8"
      })
      .then(() => resolve(this.#data))
      .catch(ex => {
        console.log(ex);
        resolve(DataManager.#defaultData());
      });
    });
  }

  generateId(){
    return Date.now().toString(36);
  }

  /** @param {Object<string, T>} data */
  #filterData(data){
    const objectMap = DataManager.#defaultData();
    if(data && typeof data === "object"){
      for(const [id, object_like] of Object.entries(data)){
        const object = this.#validator.validObject({ ...object_like, id });
        if(object !== null){
          objectMap.set(id, object);
        }
      }
    }
    return objectMap;
  }

  static #defaultData(){
    return new Map();
  }

};