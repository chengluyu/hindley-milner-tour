import * as T from './type';
import * as S from './substitution';
import unify from './unify';

export interface Constraint {
  solve(): S.Substitution;
}

export default class Equation implements Constraint {
  public constructor(public readonly left: T.Type, public readonly right: T.Type) {}

  public solve(): S.Substitution {
    if (this.left instanceof T.IntrinsicType && this.right instanceof T.IntrinsicType) {
      return S.emptySubstitution;
    }
    if (this.left instanceof T.FunctionType && this.right instanceof T.FunctionType) {
      return unify([
        new Equation(this.left.argumentType, this.right.argumentType),
        new Equation(this.left.returnType, this.right.returnType),
      ]);
    }
    if (this.left instanceof T.TypeVariable) {
      return this.right.solve(this.left);
    }
    if (this.right instanceof T.TypeVariable) {
      return this.left.solve(this.right);
    }
    throw new Error(`cannot unify ${this.left.toString()} with ${this.right.toString()}`);
  }

  public toString(): string {
    return `${this.left.toString()} ≣ ${this.right.toString()}`;
  }
}
