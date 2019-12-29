import { Map } from 'immutable';

export type Value = boolean | number | string | ((value: Value) => Value);

export type Environment = Map<string, Value>;

export class BoundName<S> {
  public constructor(public readonly name: string, public readonly store: S) {}

  public transform<T>(fn: (s: S) => T): BoundName<T> {
    return new BoundName<T>(this.name, fn(this.store));
  }
}

export abstract class Expression<S> {
  public constructor(public readonly store: S) {}
  public abstract transform<T>(fn: (s: S) => T): Expression<T>;
  public abstract evaluate(env: Environment): Value;
}

export class Literal<S> extends Expression<S> {
  public constructor(public readonly store: S, public readonly value: Value) {
    super(store);
  }

  public transform<T>(fn: (s: S) => T): Expression<T> {
    return new Literal<T>(fn(this.store), this.value);
  }

  public evaluate(): Value {
    return this.value;
  }
}

export class Variable<S> extends Expression<S> {
  public constructor(public readonly store: S, public readonly name: string) {
    super(store);
  }

  public transform<T>(fn: (s: S) => T): Expression<T> {
    return new Variable<T>(fn(this.store), this.name);
  }

  public evaluate(env: Environment): Value {
    const value = env.get(this.name);
    if (value === undefined) {
      throw new Error(`unbound variable "${this.name}"`);
    }
    return value;
  }
}

export class Abstraction<S> extends Expression<S> {
  public constructor(
    public readonly store: S,
    public readonly parameter: BoundName<S>,
    public readonly body: Expression<S>,
  ) {
    super(store);
  }

  public transform<T>(fn: (s: S) => T): Expression<T> {
    return new Abstraction<T>(
      fn(this.store),
      this.parameter.transform(fn),
      this.body.transform(fn),
    );
  }

  public evaluate(env: Environment): Value {
    return (argument: Value): Value => this.body.evaluate(env.set(this.parameter.name, argument));
  }
}

export class Application<S> extends Expression<S> {
  public constructor(
    public readonly store: S,
    public readonly callee: Expression<S>,
    public readonly argument: Expression<S>,
  ) {
    super(store);
  }

  public transform<T>(fn: (s: S) => T): Expression<T> {
    return new Application<T>(
      fn(this.store),
      this.callee.transform(fn),
      this.argument.transform(fn),
    );
  }

  public evaluate(env: Environment): Value {
    const callee = this.callee.evaluate(env);
    if (typeof callee === 'function') {
      return callee(this.argument.evaluate(env));
    }
    throw new Error(`cannot apply a ${typeof callee}`);
  }
}

export class Condition<S> extends Expression<S> {
  public constructor(
    public readonly store: S,
    public readonly condition: Expression<S>,
    public readonly consequence: Expression<S>,
    public readonly alternative: Expression<S>,
  ) {
    super(store);
  }

  public transform<T>(fn: (s: S) => T): Expression<T> {
    return new Condition<T>(
      fn(this.store),
      this.condition.transform(fn),
      this.consequence.transform(fn),
      this.alternative.transform(fn),
    );
  }

  public evaluate(env: Environment): Value {
    return this.condition.evaluate(env)
      ? this.consequence.evaluate(env)
      : this.alternative.evaluate(env);
  }
}

export class Let<S> extends Expression<S> {
  public constructor(
    public readonly store: S,
    public readonly name: BoundName<S>,
    public readonly value: Expression<S>,
    public readonly body: Expression<S>,
  ) {
    super(store);
  }

  public transform<T>(fn: (s: S) => T): Expression<T> {
    return new Let<T>(
      fn(this.store),
      this.name.transform(fn),
      this.value.transform(fn),
      this.body.transform(fn),
    );
  }

  public evaluate(env: Environment): Value {
    return this.body.evaluate(env.set(this.name.name, this.value.evaluate(env)));
  }
}

export const literal = (x: Value): Literal<undefined> => new Literal(undefined, x);
export const variable = (name: string): Variable<undefined> => new Variable(undefined, name);
export const application = (
  callee: Expression<undefined>,
  argument: Expression<undefined>,
): Application<undefined> => new Application(undefined, callee, argument);
export const condition = (
  condition: Expression<undefined>,
  consequence: Expression<undefined>,
  alternative: Expression<undefined>,
): Condition<undefined> => new Condition(undefined, condition, consequence, alternative);
