import { Map } from 'immutable';

export type Value = boolean | number | string | ((value: Value) => Value) | Closure;

export function valueToString(x: Value): string {
  if (typeof x === 'function') {
    return '<built-in function>';
  }
  if (typeof x === 'object') {
    return x.toString();
  }
  return x.toString();
}

export type Environment = Map<string, Value>;

export interface ExpressionAttributeMap<T> {
  get(x: Expression): T;
}

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
  public abstract toString(attributeMap?: ExpressionAttributeMap<string>): string;
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

  public toString(attributeMap?: ExpressionAttributeMap<string>): string {
    return attributeMap
      ? `[${JSON.stringify(this.value)} :: ${attributeMap.get(this)}]`
      : JSON.stringify(this.value);
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

  public toString(m?: ExpressionAttributeMap<string>): string {
    return m ? `[${this.name} :: ${m.get(this)}]` : this.name;
  }
}

export class Closure {
  public constructor(public readonly abstraction: Abstraction, public env: Environment) {}

  public call(x: Value): Value {
    return this.abstraction.body.evaluate(this.env.set(this.abstraction.parameter.name, x));
  }

  public toString(): string {
    return `<closure> ${this.abstraction.toString()}`;
  }
}

export class Abstraction extends Expression {
  public constructor(public readonly parameter: Variable, public readonly body: Expression) {
    super();
  }

  public evaluate(env: Environment): Value {
    return new Closure(this, env);
  }

  public accept<R = void, A extends HomogeneousArray = []>(
    visitor: ExpressionVisitor<R, A>,
    ...args: A
  ): R {
    return visitor.visitAbstraction(this, ...args);
  }

  public toString(m?: ExpressionAttributeMap<string>): string {
    const text = `λ${this.parameter.name}.${this.body.toString(m)}`;
    return m ? `[${text}] :: ${m.get(this)}` : text;
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
    if (typeof callee === 'object') {
      return callee.call(this.argument.evaluate(env));
    }
    throw new Error(`cannot apply a ${typeof callee}`);
  }

  public accept<R = void, A extends HomogeneousArray = []>(
    visitor: ExpressionVisitor<R, A>,
    ...args: A
  ): R {
    return visitor.visitApplication(this, ...args);
  }

  public toString(m?: ExpressionAttributeMap<string>): string {
    const repr = `${this.callee.toString(m)} ${this.argument.toString(m)}`;
    return m ? `[${repr}] :: ${m.get(this)}` : repr;
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

  public toString(m?: ExpressionAttributeMap<string>): string {
    const condition = this.condition.toString(m);
    const consequence = this.consequence.toString(m);
    const alternative = this.alternative.toString(m);
    const text = `if ${condition} then ${consequence} else ${alternative}`;
    return m ? `[${text}] :: ${m.get(this)}` : text;
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
    let envOfValue: Environment = env;
    if (this.value instanceof Abstraction) {
      // Here is the point: since the function may be recursive,
      // we should put it into the environment where it will be interpreted.
      // In this way, the recursive evaluation is possible.
      const closure = new Closure(this.value, env);
      envOfValue = envOfValue.set(this.name.name, closure);
      closure.env = envOfValue;
    }
    return this.body.evaluate(env.set(this.name.name, this.value.evaluate(envOfValue)));
  }

  public accept<R = void, A extends HomogeneousArray = []>(
    visitor: ExpressionVisitor<R, A>,
    ...args: A
  ): R {
    return visitor.visitLet(this, ...args);
  }

  public toString(m?: ExpressionAttributeMap<string>): string {
    return m
      ? `[let ${this.name.name}: ${m.get(this.name)} = ${this.value.toString(
          m,
        )} in ${this.body.toString(m)}] :: ${m.get(this)}`
      : `let ${this.name.name} = ${this.value.toString(m)} in ${this.body.toString(m)}`;
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
