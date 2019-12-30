import { Map } from 'immutable';
import * as T from './type';

export type Substitution = Map<number, T.Type>;

export function singleSubstitution(mapping: [number, T.Type]): Substitution {
  return Map([mapping]);
}

export const emptySubstitution: Substitution = Map();

/**
 * Apply a substition to a type.
 * @param sub the substitution to be applied
 * @param type the type to be substituted
 */
export function apply(sub: Substitution, type: T.Type): T.Type {
  return sub.reduce((target, type, id) => target.substitute(new T.TypeVariable(id), type), type);
}

/**
 * Compose two substitution together.
 * @param left the substitution to be overrided on
 * @param right the substitution to override
 */
export function compose(left: Substitution, right: Substitution): Substitution {
  return left.map(type => apply(right, type)).merge(right);
}

export function display(substition: Substitution): void {
  substition.forEach((type, id) => console.log(`t${id} :: ${type.toString()}`));
}
