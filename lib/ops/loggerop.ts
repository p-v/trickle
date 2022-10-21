import FuncOp from "./funcop";

export default class LoggerOp<T> extends FuncOp<T, void> {
  constructor(logFn: (_: T) => void) {
    super(logFn);
  }

  toString() {
    return `LoggerOp`;
  }
}
