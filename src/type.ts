export interface Type {
  equalTo(that: Type): boolean;
  toString(): string;
}

export class IntrinsicType implements Type {
  public constructor(public readonly name: string) {}
  public equalTo(that: Type): boolean {
    return that instanceof IntrinsicType && this.name === that.name;
  }
  public toString(): string {
    return this.name;
  }
}

export const integerType = new IntrinsicType('integer');

export const booleanType = new IntrinsicType('boolean');

export const stringType = new IntrinsicType('string');

export class TypeVariable implements Type {
  public constructor(public readonly id: number) {}
  public equalTo(that: Type): boolean {
    return that instanceof TypeVariable && this.id === that.id;
  }
  public toString(): string {
    return `t${this.id}`;
  }
}

export class FunctionType implements Type {
  public constructor(public readonly argumentType: Type, public readonly returnType: Type) {}
  public equalTo(that: Type): boolean {
    return (
      that instanceof FunctionType &&
      this.argumentType.equalTo(that.argumentType) &&
      this.returnType.equalTo(that.returnType)
    );
  }
  public toString(): string {
    return this.argumentType instanceof FunctionType
      ? `(${this.argumentType.toString()}) -> ${this.returnType.toString()}`
      : `${this.argumentType.toString()} -> ${this.returnType.toString()}`;
  }
}
