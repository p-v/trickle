import axios from 'axios';
import Single from './single';

export default class FuncRun<R, S> extends Single<R, S> {
  private fn: (r: R) => S;

  constructor(fn: (r: R) => S) {
    super();
    this.fn = fn;
  }

  getInput() {
    if (this.input === undefined)
      throw new Error('input not defined');
    return this.input;
  }

  run(): S {
    return this.fn(this.getInput());
  }
}
