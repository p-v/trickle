export interface Op<S, T> {
  run: () => T;
}

enum OpState {
  NOT_STARTED,
  STARTED,
  SUCCESS,
  FAILED
}

export default abstract class BaseOp<S, T> implements Op<S, T> {
  private state: OpState;
  private args: S | undefined;

  abstract exec: (_: S) => T;

  constructor() {
    this.state = OpState.NOT_STARTED;
    this.args = undefined;
  }

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
