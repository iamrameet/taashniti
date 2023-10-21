import Fn from "./fn.js";

class Vector2 {
  /**
   * @param {number} x
   * @param {number} y
  */
  constructor(x, y){
    this.x = x;
    this.y = y;
  }
  /** @param {Vector2} vector */
  "+"(vector){
    return new Vector2(this.x + vector.x, this.y + vector.y);
  }

  /** @param {Vector2} vector */
  "=="(vector){
    return this.x === vector.x && this.y === vector.y;
  }

  get "++"(){
    return new Vector2(this.x++, this.y++);
  }

  /** @param {Vector2} vector */
  static "++"(vector){
    return new Vector2(++vector.x, ++vector.y);
  }

  /** @param {Vector2} vector */
  set ""(vector){
    this.x = vector.x;
    this.y = vector.y;
    return this;
  }

};

const vec1 = new Vector2(10, 20);
const vec2 = new Vector2(20, 30);

// get "++"(){}
vec1["++"];

// static "++"(vec1){}
Vector2 ["++"](vec1);

// set ""(vec1){}
vec1[""] = vec1;

const isEqual = (vec1) ["=="] (vec2);

const vec3 = new Vector2(1, 2);
const isSmaller = (vec1) ["+"] (vec2) ["+"] (vec3);