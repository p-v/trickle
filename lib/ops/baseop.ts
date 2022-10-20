export interface Op<S, T> {
  exec: (_: S) => T;
  addNext: <U, V>(_: Op<U, V>) => void;
}

export default abstract class BaseOp<S, T> implements Op<S, T> {
  private nextOpList: Op<any, any>[];

  abstract exec: (_: S) => T;

  constructor() {
    this.nextOpList = [];
  }

  addNext = <U, V>(op: Op<U, V>): void => {
    this.nextOpList.push(op);
  }
}
