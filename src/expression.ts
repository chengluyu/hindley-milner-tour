import { Map } from 'immutable';

export type Value = boolean | number | string | ((value: Value) => Value);

export type Environment = Map<string, Value>;

export abstract class ExpressionVisitor<T = void> {
  public visit(x: Expression): T {
    return x.accept(this);
  }

  public abstract visitLiteral(x: Literal): T;
  public abstract visitVariable(x: Variable): T;
  public abstract visitAbstraction(x: Abstraction): T;
  public abstract visitApplication(x: Application): T;
  public abstract visitCondition(x: Condition): T;
  public abstract visitLet(x: Let): T;
}

export abstract class Expression {
  public abstract evaluate(env: Environment): Value;
  public abstract accept<T>(visitor: ExpressionVisitor<T>): T;
}

export class Literal extends Expression {
  public constructor(public readonly value: Value) {
    super();
  }

  public evaluate(): Value {
    return this.value;
  }

  public accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitLiteral(this);
  }
}

export class Variable extends Expression {
  public constructor(public readonly name: string) {
    super();
  }

  public evaluate(env: Environment): Value {
    const value = env.get(this.name);
    if (value === undefined) {
      throw new Error(`unbound variable "${this.name}"`);
    }
    return value;
  }

  public accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitVariable(this);
  }
}

export class Abstraction extends Expression {
  public constructor(public readonly parameter: Variable, public readonly body: Expression) {
    super();
  }

  public evaluate(env: Environment): Value {
    return (argument: Value): Value => this.body.evaluate(env.set(this.parameter.name, argument));
  }

  public accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitAbstraction(this);
  }
}

export class Application extends Expression {
  public constructor(public readonly callee: Expression, public readonly argument: Expression) {
    super();
  }

  public evaluate(env: Environment): Value {
    const callee = this.callee.evaluate(env);
    if (typeof callee === 'function') {
      return callee(this.argument.evaluate(env));
    }
    throw new Error(`cannot apply a ${typeof callee}`);
  }

  public accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitApplication(this);
  }
}

export class Condition extends Expression {
  public constructor(
    public readonly condition: Expression,
    public readonly consequence: Expression,
    public readonly alternative: Expression,
  ) {
    super();
  }

  public evaluate(env: Environment): Value {
    return this.condition.evaluate(env)
      ? this.consequence.evaluate(env)
      : this.alternative.evaluate(env);
  }

  public accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitCondition(this);
  }
}

export class Let extends Expression {
  public constructor(
    public readonly name: Variable,
    public readonly value: Expression,
    public readonly body: Expression,
  ) {
    super();
  }

  public evaluate(env: Environment): Value {
    return this.body.evaluate(env.set(this.name.name, this.value.evaluate(env)));
  }

  public accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitLet(this);
  }
}

export const literal = (x: Value): Literal => new Literal(x);

export const variable = (x: string): Variable => new Variable(x);

export const abstraction = (name: string, body: Expression): Abstraction =>
  new Abstraction(new Variable(name), body);

export const application = (callee: Expression, argument: Expression): Application =>
  new Application(callee, argument);

export const condition = (
  cond: Expression,
  whenTrue: Expression,
  whenFalse: Expression,
): Condition => new Condition(cond, whenTrue, whenFalse);

export const makeLet = (name: string, value: Expression, body: Expression): Let =>
  new Let(new Variable(name), value, body);
