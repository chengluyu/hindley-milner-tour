import * as E from './expression';
import * as T from './type';
import { Map } from 'immutable';
import Annotator from './annotator';
import Collector from './collector';
import unify from './unify';
import * as S from './substitution';

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

const env: { [name: string]: E.Value } = {
  zero: x => x === 0,
  sin: typed(isNumber, Math.sin),
  '+': typed(isNumber, x => typed(isNumber, y => x + y)),
  '-': typed(isNumber, x => typed(isNumber, y => x - y)),
  '*': typed(isNumber, x => typed(isNumber, y => x * y)),
  '/': typed(isNumber, x => typed(isNumber, y => x / y)),
};

const typeEnv: { [name: string]: T.Type } = {
  zero: new T.FunctionType(T.integerType, T.booleanType),
  sin: new T.FunctionType(T.integerType, T.integerType),
  '+': new T.FunctionType(T.integerType, new T.FunctionType(T.integerType, T.integerType)),
  '-': new T.FunctionType(T.integerType, new T.FunctionType(T.integerType, T.integerType)),
  '*': new T.FunctionType(T.integerType, new T.FunctionType(T.integerType, T.integerType)),
  '/': new T.FunctionType(T.integerType, new T.FunctionType(T.integerType, T.integerType)),
};

function test(e: E.Expression): void {
  const a = new Annotator(Map(typeEnv));
  a.visit(e);

  console.log('The annotated expression:');
  console.log(e.toString(a));

  console.log('Type constraints:');
  const c = new Collector(a);
  c.visit(e);
  c.display();

  console.log('Solution set:');
  const sub = unify(c.getEquations());
  S.display(sub);

  console.log('The typed expression:');
  console.log(e.toString({ get: x => S.apply(sub, a.getType(x)).toString() }));
  console.log(e.evaluate(Map(env))); // should be 'correct'
}

test(
  E.condition(
    E.application(E.variable('zero'), E.application(E.variable('sin'), E.literal(0))),
    E.literal('correct'),
    E.literal('incorrect'),
  ),
);

test(
  E.makeLet(
    'x',
    E.literal(1),
    E.makeLet(
      'y',
      E.literal(1),
      E.application(E.application(E.variable('+'), E.variable('x')), E.variable('y')),
    ),
  ),
);
