import * as T from './type';
import { Substitution, emptySubstitution } from './substitution';

export interface Constraint {
  solve(): Substitution;
}

function unify(equations: Equation[]): Substitution {
  let substitution = emptySubstitution;
  while
}

export default class Equation implements Constraint {
  public constructor(public readonly left: T.Type, public readonly right: T.Type) {}

  public solve(): Substitution {
    if (this.left instanceof T.IntrinsicType && this.right instanceof T.IntrinsicType) {
      return emptySubstitution;
    }
    if (this.left instanceof T.FunctionType && this.right instanceof T.FunctionType) {
      return
    }
    if (this.left instanceof T.TypeVariable) {
      return this.right.solve(this.left);
    }
    if (this.right instanceof T.TypeVariable) {
      return this.left.solve(this.right);
    }
    throw new Error(`cannot unify ${this.left.toString()} with ${this.right.toString()}`);
  }
}
