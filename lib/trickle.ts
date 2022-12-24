import { EventEmitter } from "events";
import _ from "lodash";
import { LogOptions, createProgresInstance, ProgressEvent } from "./progress";
import { generateActionId } from "./utils";

type Environment = { [key: string]: any };

type Options = {
  logOptions?: LogOptions;
  progress?: EventEmitter;
};

type EnvironmentArgType = `{{${string}}}`;
type ContextArgType = `<<${string}>>`;
type CustomArgType = EnvironmentArgType | ContextArgType;

type WithCustomArg<T> = {
  [P in keyof T]:
    | (T[P] extends object ? WithCustomArg<T[P]> : T[P])
    | CustomArgType;
};

const globalEnvTemplateExpr = new RegExp("^{{(.*)}}$");
const contextEnvTemplateExpr = new RegExp("^<<(.*)>>$");

function hydrateTemplate(
  arg: any,
  globals: Environment,
  context: Environment
): any {
  if (typeof arg === "string") {
    let match = globalEnvTemplateExpr.exec(arg);
    if (match) {
      return _.get(globals, match[1]);
    }
    match = contextEnvTemplateExpr.exec(arg);
    if (match) {
      return _.get(context, match[1]);
    }
  } else if (Array.isArray(arg)) {
    return arg.map((item) => hydrateTemplate(item, globals, context));
  } else if (typeof arg === "object") {
    for (const attr in arg) {
      arg[attr] = hydrateTemplate(arg[attr], globals, context);
    }
  }
  return arg;
}

export class Trickle<X> {
  private globals: Environment;
  private context: Environment;
  private settings: Options;
  private ops: any[];

  constructor(
    globals: Environment,
    context: Environment,
    settings: Options = {},
    ops: any[] = []
  ) {
    this.globals = globals;
    this.context = context;
    this.settings = settings;
    this.ops = ops;
    if (this.settings.logOptions && !this.settings.progress) {
      this.settings.progress = createProgresInstance(this.settings.logOptions);
    }
  }

  private resolveArgs(args: any[]): any {
    return args.map((arg) => hydrateTemplate(arg, this.globals, this.context));
  }

  new<M extends any[], N>(
    func: (...x: M) => N | Promise<N>,
    args: M | WithCustomArg<M>,
    action: string = "new",
    opts?: { ignoreLogs: boolean }
  ) {
    const aid = generateActionId();
    this.settings.progress?.emit(ProgressEvent.ADD, action, aid, opts);
    this.ops.push({ fn: () => func(...(this.resolveArgs(args) as M)), aid });
    return new Trickle<N>(this.globals, this.context, this.settings, this.ops);
  }

  store(
    fn: (x: X) => { [key: string]: any },
    action: string = "store",
    opts?: { ignoreLogs: boolean }
  ) {
    const aid = generateActionId();
    this.settings.progress?.emit(ProgressEvent.ADD, action, aid, opts);
    this.ops.push({
      fn: (obj: X) => {
        let x = fn(obj);
        Object.keys(x).forEach((k) => (this.context[k] = x[k]));
        return obj;
      },
      aid,
    });
    return this;
  }

  continue(
    func: (x: X) => void,
    action: string = "continue",
    opts?: { ignoreLogs: boolean }
  ) {
    const aid = generateActionId();
    this.settings.progress?.emit(ProgressEvent.ADD, action, aid, opts);
    this.ops.push({
      fn: (prev: any) => {
        func(prev);
        return prev;
      },
      aid,
    });
    return this;
  }

  transform<N>(
    func: (x: X) => N,
    action: string = "transform",
    opts?: { ignoreLog: boolean }
  ) {
    const aid = generateActionId();
    this.settings.progress?.emit(ProgressEvent.ADD, action, aid, opts);
    this.ops.push({ fn: (prev: any) => func(prev), aid });
    return new Trickle<N>(this.globals, this.context, this.settings, this.ops);
  }

  async done() {
    this.settings.progress?.emit(ProgressEvent.START);
    let prev = null;
    for (let { fn, aid } of this.ops) {
      try {
        prev = await Promise.resolve(fn(prev));
        this.settings.progress?.emit(ProgressEvent.RESULT, aid, prev);
      } catch (err) {
        this.settings.progress?.emit(ProgressEvent.FAILURE, aid, err);
        // Wait for the pending rendering events to process
        await new Promise((_, reject) => setTimeout(() => reject(err), 0));
      }
    }
    this.settings.progress?.emit(ProgressEvent.SUCCESS);
    return prev;
  }
}
