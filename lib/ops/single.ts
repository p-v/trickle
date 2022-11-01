
export default abstract class SingleInputOp<S, T> {
  protected input: S | undefined;
  
  constructor() {
    this.input = undefined;

  }

  setInput(input: S) {
    this.input = input;
  }

  getInput() {
    return this.input;
  }

  abstract run(): T;
}
