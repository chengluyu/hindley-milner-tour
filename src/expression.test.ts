import * as E from './expression';
import { Map } from 'immutable';

const env: { [name: string]: E.Value } = {
  zero: x => x === 0,
  sin: x => {
    if (typeof x === 'number') {
      return Math.sin(x);
    }
    throw new Error('"sin" expects its argument to be a number');
  },
};

const e0 = E.condition(
  E.application(E.variable('zero'), E.application(E.variable('sin'), E.literal(0))),
  E.literal('correct'),
  E.literal('incorrect'),
);

console.log('>', e0.toString()); // pretty print the expression
console.log(e0.evaluate(Map(env))); // should be 'correct'
