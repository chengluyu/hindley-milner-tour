import { Map } from 'immutable';
import * as T from './type';

export type Substitution = Map<number, T.Type>;

export function singleSubstitution(mapping: [number, T.Type]): Substitution {
  return Map([mapping]);
}

export const emptySubstitution: Substitution = Map();

export function compose(s: Substitution, t: Substitution): Substitution {
  const entries: [number, T.Type][] = [];
  for (const [id, type] of s) {
  }
}
