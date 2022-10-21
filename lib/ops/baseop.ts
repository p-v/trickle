export interface Op<S, T> {
  run: () => T;
  addNext: <U, V>(_: Op<U, V>) => void;
}

enum OpState {
  NOT_STARTED,
  STARTED,
  SUCCESS,
  FAILED
}

export default abstract class BaseOp<S, T> implements Op<S, T> {
  private nextOpList: Op<any, any>[];
  private state: OpState;
  private args: S | undefined;

  abstract exec: (_: S) => T;

  constructor() {
    this.nextOpList = [];
    this.state = OpState.NOT_STARTED;
    this.args = undefined;
  }

  addNext = <U, V>(op: Op<U, V>): void => {
    this.nextOpList.push(op);
  };


  setArgs = (args: S) => {
    this.args = args;
  }

  run = (): T => {
    this.markState(OpState.STARTED)
    try {
      if (this.args === undefined) throw new Error('args not defined!');
      let t = this.exec(this.args);
      this.markState(OpState.SUCCESS)
      return t;
    } catch (e) {
      this.markState(OpState.FAILED)
      throw e;
    }
  };

  markState = (state: OpState) => {
    this.state = state;
  }

  getState = () => this.state;
}
