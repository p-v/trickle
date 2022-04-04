import _ from "lodash";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

type Store = {
  [key: string]: string | number | boolean;
};

type RetryConfig = {
  retryCount?: number;
  delayInterval?: number;
};

const DEFAULT_RETRY_COUNT = 5;
const DEFAULT_DELAY_INTERVAL = 1000;

const defaultRetryConfig = {
  retryCount: DEFAULT_RETRY_COUNT,
  delayInterval: DEFAULT_DELAY_INTERVAL,
};

const varTemplateExpr = new RegExp("^{{(.*)}}$");

class Perform<Type> {
  private dict: any;

  constructor(dict: any) {
    this.dict = dict;
  }

  getGlobalVal(key: string) {
    return _.get(this.dict.g, key);
  }

  private resolveArgs(args: any[]) {
    return args.map((arg) => {
      if (typeof arg === "string") {
        const match = varTemplateExpr.exec(arg);
        if (match) {
          return _.get(this.dict.g, match[1]);
        }
      }
      return arg;
    });
  }

  peek(fn: (x: Type) => any, name: string = "peek"): Perform<Type> {
    const op = (args: Type) => {
      console.log(args);
      fn(args);
      return args;
    };
    this.dict.ops.push({ op, name });
    return this;
  }

  perform<N>(
    fn: (...x: any) => N | PromiseLike<N>,
    args: Parameters<typeof fn>,
    name = "perform"
  ): Perform<N> {
    const op = (prev: any) =>
      prev ? fn.call(null, prev) : fn(...this.resolveArgs(args));
    this.dict.ops.push({ op, name });
    return new Perform<N>(this.dict);
  }

  performNew<N>(
    fn: (...x: any) => N | PromiseLike<N>,
    args: Parameters<typeof fn>,
    name: string = "performNew"
  ): Perform<N> {
    const op = () => fn(...this.resolveArgs(args));
    this.dict.ops.push({ op, name });
    return new Perform<N>(this.dict);
  }

  performUntil<N>(
    fn: (...x: any) => N | PromiseLike<N>,
    args: Parameters<typeof fn>,
    retryFn: (_: N) => boolean,
    retryConfig: RetryConfig = defaultRetryConfig,
    name: string = "performUntil"
  ) {
    const op = async () => {
      const { retryCount, delayInterval } = {
        ...defaultRetryConfig,
        ...retryConfig,
      };
      const resArgs = this.resolveArgs(args);
      let res = await Promise.resolve(fn(...resArgs));
      let retryN = 0;
      let interval = delayInterval;
      while (!(await Promise.resolve(retryFn(res)))) {
        await delay(interval);
        interval = 2 * interval;
        res = await Promise.resolve(fn(...resArgs));
        retryN++;
        if (retryN >= retryCount) {
          throw new Error("Condition timeout");
        }
      }

      return res;
    };
    this.dict.ops.push({ op, name });
    return new Perform<N>(this.dict);
  }

  transform<Output>(
    fn: (x: Type) => Output | PromiseLike<Output>,
    name = "transform"
  ): Perform<Output> {
    const op = (args: Type) => fn(args);
    this.dict.ops.push({ op, name });
    return new Perform<Output>(this.dict);
  }

  globalArgs(
    from: string,
    to: string,
    name: string = "globalArgs"
  ): Perform<Type> {
    const op = (obj: Type) => {
      _.set(this.dict.g, to, _.get(obj, from));
    };
    this.dict.ops.push({ op, name });
    return this;
  }

  validate(fn: (_: Type) => boolean, name?: string): Perform<Type> {
    name = name || "validate";
    const op = (args: any) => {
      if (!fn(args)) {
        throw new Error("Validation error");
      }
      return true;
    };
    this.dict.ops.push({ op, name });
    return this;
  }

  async done(): Promise<void> {
    let prev = null;
    for (const opr of this.dict.ops) {
      const { op, name } = opr;
      console.log("Executing: " + name);
      prev = await Promise.resolve(op(prev));
      console.log("Result: " + prev);
    }
    console.log("All operations completed");
  }
}

export default class Trickle {
  private constructor() {}

  public static withStore(store: Store) {
    return new Perform({
      ops: [],
      g: store,
    });
  }

  public static perform<T>(
    fn: (...x: any) => T | PromiseLike<T>,
    args: Parameters<typeof fn>,
    dict: any = { ops: [], g: {} },
    name: string = "perform"
  ): Perform<T> {
    const perf = new Perform<T>(dict);
    return perf.perform(fn, args, name);
  }
}
