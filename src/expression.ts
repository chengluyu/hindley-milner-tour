import { Map } from 'immutable';

export type Value = boolean | number | string | ((value: Value) => Value);

export type Environment = Map<string, Value>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HomogeneousArray = Array<any>;

export abstract class ExpressionVisitor<R = void, Args extends HomogeneousArray = []> {
  public visit(x: Expression, ...args: Args): R {
    return x.accept(this, ...args);
  }

  public abstract visitLiteral(x: Literal, ...args: Args): R;
  public abstract visitVariable(x: Variable, ...args: Args): R;
  public abstract visitAbstraction(x: Abstraction, ...args: Args): R;
  public abstract visitApplication(x: Application, ...args: Args): R;
  public abstract visitCondition(x: Condition, ...args: Args): R;
  public abstract visitLet(x: Let, ...args: Args): R;
}

export abstract class Expression {
  public abstract evaluate(env: Environment): Value;
  public abstract accept<R = void, Args extends HomogeneousArray = []>(
    visitor: ExpressionVisitor<R, Args>,
    ...args: Args
  ): R;
}

export class Literal extends Expression {
  public constructor(public readonly value: Value) {
    super();
  }

  public evaluate(): Value {
    return this.value;
  }

  public accept<R = void, A extends HomogeneousArray = []>(
    visitor: ExpressionVisitor<R, A>,
    ...args: A
  ): R {
    return visitor.visitLiteral(this, ...args);
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

  public accept<R = void, A extends HomogeneousArray = []>(
    visitor: ExpressionVisitor<R, A>,
    ...args: A
  ): R {
    return visitor.visitVariable(this, ...args);
  }
}

export class Abstraction extends Expression {
  public constructor(public readonly parameter: Variable, public readonly body: Expression) {
    super();
  }

  public evaluate(env: Environment): Value {
    return (argument: Value): Value => this.body.evaluate(env.set(this.parameter.name, argument));
  }

  public accept<R = void, A extends HomogeneousArray = []>(
    visitor: ExpressionVisitor<R, A>,
    ...args: A
  ): R {
    return visitor.visitAbstraction(this, ...args);
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

  public accept<R = void, A extends HomogeneousArray = []>(
    visitor: ExpressionVisitor<R, A>,
    ...args: A
  ): R {
    return visitor.visitApplication(this, ...args);
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

  public accept<R = void, A extends HomogeneousArray = []>(
    visitor: ExpressionVisitor<R, A>,
    ...args: A
  ): R {
    return visitor.visitCondition(this, ...args);
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

  public accept<R = void, A extends HomogeneousArray = []>(
    visitor: ExpressionVisitor<R, A>,
    ...args: A
  ): R {
    return visitor.visitLet(this, ...args);
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
