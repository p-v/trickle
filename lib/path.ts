import BaseOp from "./ops/baseop"

const links = new Map();

const isPromise = (promise: any) =>
  typeof promise?.then === 'function'

export const addLink = <S, T, U>(op1: BaseOp<S, T>, op2: BaseOp<T, U>) => {
  const next = links.get(op1) ?? [];
  links.set(op1, next);
  next.push(op2);
}

export const walk = async <S, T> (op: BaseOp<S, T>, arg: S) => {
  const q = [];
  q.push(op);

  let prev: any = arg;
  while (q.length > 0) {
    let o = q.shift()
    o?.setArgs(prev);
    prev = o?.run()
    prev = isPromise(prev) ? await prev : prev;
    let nextOps = links.get(o) ?? [];
    nextOps.forEach((p: any) => q.push(p));
  }
}
