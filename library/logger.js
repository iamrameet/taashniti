import { writeFile, appendFile } from "fs/promises";

/** @template {string} T */
export default class Logger {

  static Level = /** @type {const} */ ({
    NONE: 0,
    LOG: 1,
    WARN: 2,
    ERROR: 4,
    ALL: 7
  });

  static #level = this.Level.ALL;
  static #path = "data/logs/";
  static #testing = false;
  static #fileName = this.#getTime(true);
  static get fileName(){
    return this.#path + this.#fileName + ".log";
  }
  /** @param {boolean} value */
  static set testing(value){
    this.#testing = Boolean(value);
    this.#fileName = this.#testing ? "test" : this.#getTime(true);
  }
  /** @param {string} path */
  static set logsDirectory(path){
    this.#path = path + (path.at(-1) === "/" ? "" : "/");
  }

  /** @param {Logger.Level} value */
  static set level(value){
    if(value >= this.Level.NONE && value <= this.Level.ALL){
      this.#level = value;
    }
  }

  #type;
  /** @param {T} type */
  constructor(type){
    this.#type = type;
  }
  async log(...args){
    Logger.log(this.#type, ...args);
  }
  async error(...error){
    Logger.error(this.#type, ...error);
  }

  static async log(type, ...args){
    if((this.#level & Logger.Level.LOG) === 0)
      return;
    console.log(`[LOG] [${ type }]: `, ...args);
    await this.#saveFile("LOG", type, args);
  }
  static async error(type, ...errors){
    if((this.#level & Logger.Level.ERROR) === 0)
      return;
    console.trace(`[ERR] [${type}]: `, ...errors);
    await this.#saveFile("ERR", type, errors);
  }

  static #getTime(replaceColon = false){
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = date.getMonth() + 1;
    const dd = date.getDate();
    const time = date.toLocaleTimeString("en-IN", { hour12: false });
    return `${ yyyy }-${ mm }-${ dd } ${
      replaceColon ? time.replace(/:/g, "-") : time
    }`;
  }

  static #createFile(){
    try{
      writeFile(
        this.fileName,
        `${this.#fileName}
`, { encoding: "utf-8" }
      );
    } catch(ex){
      console.log(ex);
    }
  }

  /**
   * @param {"LOG" | "ERR"} logType
   * @param {string} subType
   * @param {string[]} data
  */
  static async #saveFile(logType, subType, data){
    try{
      await appendFile(
        this.fileName,
        `[${ this.#getTime() }] [${ logType }] [${ subType }]:
  ${ data.join(`
`) }
`
      );
    } catch(ex){
      console.log(ex);
    }
  }
};