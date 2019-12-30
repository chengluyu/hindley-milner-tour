import * as E from './expression';
import * as T from './type';
import { Map } from 'immutable';
import Annotator from './annotator';

const env: { [name: string]: E.Value } = {
  zero: x => x === 0,
  sin: x => {
    if (typeof x === 'number') {
      return Math.sin(x);
    }
    throw new Error('"sin" expects its argument to be a number');
  },
  add: x => {
    if (typeof x === 'number') {
      return (y: E.Value): E.Value => {
        if (typeof y === 'number') {
          return x + y;
        }
        throw new Error('"sin" expects its argument to be a number');
      };
    }
    throw new Error('"sin" expects its argument to be a number');
  },
};

const typeEnv: { [name: string]: T.Type } = {
  zero: new T.FunctionType(T.integerType, T.booleanType),
  sin: new T.FunctionType(T.integerType, T.integerType),
  add: new T.FunctionType(T.integerType, new T.FunctionType(T.integerType, T.integerType)),
};

function test(e: E.Expression): void {
  const a = new Annotator(Map(typeEnv));
  a.visit(e);
  console.log('>', e.toString(a)); // pretty print the expression
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
      E.application(E.application(E.variable('add'), E.variable('x')), E.variable('y')),
    ),
  ),
);
