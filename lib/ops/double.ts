import { Op } from './baseop';

export default abstract class DoubleInputOp<R, S, T> {

  private input1: R | undefined;
  private input2: S | undefined;

  constructor() {
    this.input1 = undefined;
    this.input2 = undefined;
  }

  setInput1(input1: R) {
    this.input1 = input1;
  }

  setInput2(input2: S) {
    this.input2 = input2;
  }

  getInput1() {
    return this.input1;
  }

  getInput2() {
    return this.input2;
  }

  abstract run(): T;
}

