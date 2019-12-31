import { Map } from 'immutable';
import * as E from './expression';
import * as T from './type';
import * as S from './substitution';
import Annotator from './annotator';
import Collector from './collector';
import unify from './unify';
import * as builtin from './builtin';

export default class Repl {
  public constructor(
    private valueEnv = Map(builtin.valueEnv),
    private typeEnv = Map(builtin.typeEnv),
  ) {}

  public get env(): Map<string, T.Type> {
    return this.typeEnv;
  }

  public evaluate(e: E.Expression): [T.Type, E.Value] {
    const annotator = new Annotator(this.typeEnv);
    const collector = new Collector(annotator);
    annotator.visit(e);
    collector.visit(e);
    return [
      S.apply(unify(collector.getEquations()), annotator.getType(e)),
      e.evaluate(this.valueEnv),
    ];
  }

  public declare(declarations: [string, E.Expression][]): void {
    for (const [name, expression] of declarations) {
      const [type, value] = this.evaluate(expression);
      this.valueEnv = this.valueEnv.set(name, value);
      this.typeEnv = this.typeEnv.set(name, type);
    }
  }
}
