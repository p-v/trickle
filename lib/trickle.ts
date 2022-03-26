import _ from "lodash";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

type RetryArgs<T> = {
  condition: (_: T) => boolean;
  retryCount: number;
};

const varTemplateExpr = new RegExp("^{{.*}}$");

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

  perform(
    fn: (...x: any) => Type | PromiseLike<Type>,
    args: Parameters<typeof fn>,
    name = "perform"
  ): Perform<Type> {
    const op = (prev: any) => (prev ? fn.call(null, prev) : fn(...args));
    this.dict.ops.push({ op, name });
    return this;
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

  peformUntil<N>(
    fn: (...x: any) => N | PromiseLike<N>,
    args: Parameters<typeof fn>,
    retry: RetryArgs<N>,
    name: string = "performUntil"
  ) {
    const op = async () => {
      const { condition, retryCount } = retry;
      const resArgs = this.resolveArgs(args);
      let res = await Promise.resolve(fn(...resArgs));
      let retryN = 0;
      let interval = 1000;
      while (!(await Promise.resolve(condition(res)))) {
        await delay(interval);
        interval = 2 * interval;
        res = await Promise.resolve(fn(...resArgs));
        retryN++;
        if (retryN >= retryCount) {
          throw new Error("Failed to fetch");
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
        console.log("Error --------------------------")
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
      prev = Promise.resolve(op(prev));
      console.log("Performing:" + name);
    }
    console.log("All operations completed");
  }
}

export default class Trickle {
  private constructor() {}

  public static perform<T>(
    fn: (...x: any) => T | PromiseLike<T>,
    args: Parameters<typeof fn>,
    dict: any = {ops:[], g: {}},
    name: string = "perform",
  ): Perform<T> {
    const perf = new Perform<T>(dict);
    return perf.perform(fn, args, name);
  }
}
