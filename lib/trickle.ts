import _ from "lodash";
type Environment = { [key: string]: any };

const globalEnvTemplateExpr = new RegExp("^{{(.*)}}$");
const contextEnvTemplateExpr = new RegExp("^<<(.*)>>$");

export class Trickle<X> {
  private globals: Environment;
  private context: Environment;
  private ops: any[];

  constructor(globals: Environment, context: Environment, ops: any[] = []) {
    this.globals = globals;
    this.context = context;
    this.ops = ops;
  }

  private resolveArgs(args: any[]) {
    return args.map((arg) => {
      if (typeof arg === "string") {
        let match = globalEnvTemplateExpr.exec(arg);
        if (match) {
          return _.get(this.globals, match[1]);
        }
        match = contextEnvTemplateExpr.exec(arg);
        if (match) {
          return _.get(this.context, match[1]);
        }
      }
      return arg;
    });
  }

  new<M extends any[], N>(func: (...x: M) => N | Promise<N>, args: M) {
    this.ops.push(() => func(...(this.resolveArgs(args) as M)));
    return new Trickle<N>(this.globals, this.context, this.ops);
  }

  store(fn: (x: X) => { [key: string]: any }) {
    this.ops.push((obj: X) => {
      let x = fn(obj);
      Object.keys(x).forEach((k) => (this.context[k] = x[k]));
      return obj;
    });
    return this;
  }

  continue(func: (x: X) => void) {
    this.ops.push((prev: any) => {
      func(prev);
      return prev;
    });
    return this;
  }

  transform<N>(func: (x: X) => N) {
    this.ops.push((prev: any) => func(prev));
    return new Trickle<N>(this.globals, this.context, this.ops);
  }

  async done() {
    let prev = null;
    for (let op of this.ops) {
      prev = await Promise.resolve(op(prev));
    }
    return prev;
  }
}
