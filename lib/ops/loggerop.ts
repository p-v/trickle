import FuncOp from "./funcop";

export default class LoggerOp<T> extends FuncOp<T, void> {
  private logFn: (_: T) => void;
  constructor(logFn: (_: T) => void) {
    super(logFn);
    this.logFn = logFn;
  }

  exec = (t: T): void => {
    this.logFn(t);
  };
}
