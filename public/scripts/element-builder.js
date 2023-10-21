import BlockConstruct from "../components/block-construct.js";
import InlineConstruct from "../components/inline-construct.js";

/** @template {keyof ScopeMap} S */
export default class ElementBuilder {

  #scope;
  #builder;

  /** @param {S} scope */
  constructor(Builder, scope){
    this.#builder = Builder;
    this.#scope = scope;
  }

  /** @param {ReturnType<StatementBuilder["statement"]>} statement */
  statement({ type, ...content }){
    switch(type){
      case "if":
        return this.if(content);
      case "method":
        return this.method(content);
      default:
        return new Comment(`Invalid statement of type '${ type }' provided.`);
    }
  }

  /**
   * @template {IfStatement<ScopeMap[S]>} If
   * @param {If} content
  */
  if({ condition, trueBody, falseBody }){
    return BlockConstruct.from(
      this.#scope,
      this.method(condition),
      trueBody.map(statement => this.statement(statement)),
      falseBody.map(statement => this.statement(statement))
    );
  }

  /**
   * @template {MethodStatement<ScopeMap[S]>} M
   * @param {M} content
  */
  method({ name, args }){
    const { data } = this.#builder;
    // console.log(data, this.#scope);
    const method = (
      name in data.scopes[this.#scope].methods
        ? data.scopes[this.#scope].methods
        : data.scopes.global.methods
    )[name];
    return InlineConstruct.from(
      name,
      method,
      args.map(statement => typeof statement === "string"
        ? this.#builder.findLiteralOrVariable(this.#scope, statement)
        : this.method(statement))
    );
  }
};