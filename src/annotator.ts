import * as E from './expression';
import * as T from './type';
import { Map } from 'immutable';

type Environment = Map<string, T.Type>;

export default class Annotator extends E.ExpressionVisitor<T.Type, [Environment]>
  implements E.ExpressionAttributeMap<string> {
  private exprTypeVarMap = new WeakMap<E.Expression, T.Type>();

  private variableCounter = 0;

  public constructor(public readonly defaultEnv: Environment = Map()) {
    super();
  }

  public get(x: E.Expression): string {
    return this.exprTypeVarMap.get(x)?.toString() ?? '?';
  }

  public getType(x: E.Expression): T.Type {
    const type = this.exprTypeVarMap.get(x);
    if (type === undefined) {
      throw new Error('no type information of the given expression');
    }
    return type;
  }

  private tick(): number {
    return this.variableCounter++;
  }

  public visit(x: E.Expression, env: Environment = this.defaultEnv): T.Type {
    const typeVar = x.accept(this, env);
    this.exprTypeVarMap.set(x, typeVar);
    return typeVar;
  }

  public visitLiteral(/* x: E.Literal, env: Environment */): T.Type {
    return new T.TypeVariable(this.tick());
  }

  public visitVariable(x: E.Variable, env: Environment): T.Type {
    const type = env.get(x.name);
    if (type === undefined) {
      throw new Error(`unbound variable "${x.name}"`);
    }
    return type;
  }

  public visitAbstraction(x: E.Abstraction, env: Environment): T.Type {
    const parameterType = new T.TypeVariable(this.tick());
    this.exprTypeVarMap.set(x.parameter, parameterType);
    this.visit(x.body, env.set(x.parameter.name, parameterType));
    return new T.TypeVariable(this.tick());
  }

  public visitApplication(x: E.Application, env: Environment): T.Type {
    this.visit(x.callee, env);
    this.visit(x.argument, env);
    return new T.TypeVariable(this.tick());
  }

  public visitCondition(x: E.Condition, env: Environment): T.Type {
    this.visit(x.condition, env);
    this.visit(x.consequence, env);
    this.visit(x.alternative, env);
    return new T.TypeVariable(this.tick());
  }

  public visitLet(x: E.Let, env: Environment): T.Type {
    this.exprTypeVarMap.set(x.name, new T.TypeVariable(this.tick()));
    this.visit(x.body, env.set(x.name.name, this.visit(x.value, env)));
    return new T.TypeVariable(this.tick());
  }
}
