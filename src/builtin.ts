import * as E from './expression';
import * as T from './type';

function typed<T extends E.Value>(
  check: (x: E.Value) => x is T,
  impl: (x: T) => E.Value,
): (x: E.Value) => E.Value {
  return (x: E.Value): E.Value => {
    if (check(x)) {
      return impl(x);
    }
    throw new Error('type mismatch');
  };
}

function isNumber(x: E.Value): x is number {
  return typeof x === 'number';
}

export const valueEnv: { [name: string]: E.Value } = {
  zero: x => x === 0,
  sin: typed(isNumber, Math.sin),
  add: typed(isNumber, x => typed(isNumber, y => x + y)),
  sub: typed(isNumber, x => typed(isNumber, y => x - y)),
  mul: typed(isNumber, x => typed(isNumber, y => x * y)),
  div: typed(isNumber, x => typed(isNumber, y => x / y)),
};

export const typeEnv: { [name: string]: T.Type } = {
  zero: T.fn(T.bool, T.int),
  sin: T.fn(T.int, T.int),
  add: T.fn(T.int, T.int, T.int),
  sub: T.fn(T.int, T.int, T.int),
  mul: T.fn(T.int, T.int, T.int),
  div: T.fn(T.int, T.int, T.int),
};
