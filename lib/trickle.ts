import _ from "lodash";
type Environment = { [key: string]: any };

type Logger = {
  debug(...args: any[]): void;
  info(...args: any[]): void;
  error(...args: any[]): void;
};

type Settings = {
  logger?: Logger;
};

const globalEnvTemplateExpr = new RegExp("^{{(.*)}}$");
const contextEnvTemplateExpr = new RegExp("^<<(.*)>>$");

export class Trickle<X> {
  private globals: Environment;
  private context: Environment;
  private settings: Settings;
  private ops: any[];

  constructor(
    globals: Environment,
    context: Environment,
    settings: Settings = {},
    ops: any[] = []
  ) {
    this.globals = globals;
    this.context = context;
    this.settings = settings;
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

  new<M extends any[], N>(
    func: (...x: M) => N | Promise<N>,
    args: M,
    action: string = "new"
  ) {
    this.ops.push({ fn: () => func(...(this.resolveArgs(args) as M)), action });
    return new Trickle<N>(this.globals, this.context, this.settings, this.ops);
  }

  store(fn: (x: X) => { [key: string]: any }, action: string = "store") {
    this.ops.push({
      fn: (obj: X) => {
        let x = fn(obj);
        Object.keys(x).forEach((k) => (this.context[k] = x[k]));
        return obj;
      },
      action,
    });
    return this;
  }

  continue(func: (x: X) => void, action: string = "continue") {
    this.ops.push({
      fn: (prev: any) => {
        func(prev);
        return prev;
      },
      action,
    });
    return this;
  }

  transform<N>(func: (x: X) => N, action: string = "transform") {
    this.ops.push({ fn: (prev: any) => func(prev), action });
    return new Trickle<N>(this.globals, this.context, this.settings, this.ops);
  }

  async done() {
    let prev = null;
    for (let { fn, action } of this.ops) {
      this.settings.logger?.info(action);
      prev = await Promise.resolve(fn(prev));
    }
    return prev;
  }
}
