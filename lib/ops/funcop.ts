import BaseOp from "./baseop";

export default class FuncOp<T, V> extends BaseOp<T, V> {
  private func: (_: T) => V;

  constructor(func: (_: T) => V) {
    super();
    this.func = func;
  }

  exec = (t: T): V => this.func(t);

  toString() {
    return `FuncOp`;
  }
}
