import * as S from './substitution';
import Equation from './constraint';

/**
 * Solve a sequence of type equations.
 * @param equations the equations to be solved
 */
export default function unify(equations: Equation[]): S.Substitution {
  if (equations.length === 0) {
    return S.emptySubstitution;
  }
  let solution = equations[0].solve();
  const length = equations.length;
  for (let i = 1; i < length; i++) {
    // Apply the current solution to the rest of the equations
    for (let j = i; j < length; j++) {
      equations[j] = new Equation(
        S.apply(solution, equations[j].left),
        S.apply(solution, equations[j].right),
      );
    }
    // Compose the current solution with the new substitution
    solution = S.compose(solution, equations[i].solve());
  }
  return solution;
}
