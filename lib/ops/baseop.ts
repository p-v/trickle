export interface Op<S, T> {
  run: (_: S) => T;
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

  abstract exec: (_: S) => T;

  constructor() {
    this.nextOpList = [];
    this.state = OpState.NOT_STARTED;
  }

  addNext = <U, V>(op: Op<U, V>): void => {
    this.nextOpList.push(op);
  };

  run = (s: S): T => {
    this.markState(OpState.STARTED)
    try {
      let t = this.exec(s);
      this.markState(OpState.SUCCESS)
      return t;
    } catch (e) {
      this.markState(OpState.FAILED)
      throw e;
    }
  };

  triggerNext = () => {

  }

  markState = (state: OpState) => {
    this.state = state;
  }

  getState = () => this.state;
}
