import { Substitution, singleSubstitution, emptySubstitution } from './substitution';

export abstract class Type {
  public abstract equalTo(that: Type): boolean;
  public abstract toString(): string;
  public abstract contains(typeVar: TypeVariable): boolean;
  public abstract substitute(typeVar: TypeVariable, targetType: Type): Type;
  public solve(typeVar: TypeVariable): Substitution {
    if (this.contains(typeVar)) {
      throw new Error(`circular type reference of ${typeVar.toString()} in ${this.toString()}`);
    }
    return singleSubstitution([typeVar.id, this]);
  }
}

export class IntrinsicType extends Type {
  public constructor(public readonly name: string) {
    super();
  }
  public equalTo(that: Type): boolean {
    return that instanceof IntrinsicType && this.name === that.name;
  }
  public toString(): string {
    return this.name;
  }
  public contains(/* typeVar: TypeVariable */): boolean {
    return false;
  }
  public substitute(/* typeVar: TypeVariable, targetType: Type */): Type {
    return this;
  }
}

export const integerType = new IntrinsicType('integer');

export const booleanType = new IntrinsicType('boolean');

export const stringType = new IntrinsicType('string');

export class TypeVariable extends Type {
  public constructor(public readonly id: number) {
    super();
  }
  public equalTo(that: Type): boolean {
    return that instanceof TypeVariable && this.id === that.id;
  }
  public toString(): string {
    return `t${this.id}`;
  }
  public contains(typeVar: TypeVariable): boolean {
    return this.id === typeVar.id;
  }
  public solve(typeVar: TypeVariable): Substitution {
    return this.id === typeVar.id ? emptySubstitution : singleSubstitution([typeVar.id, this]);
  }
  public substitute(typeVar: TypeVariable, targetType: Type): Type {
    return this.id === typeVar.id ? targetType : this;
  }
}

export class FunctionType extends Type {
  public constructor(public readonly argumentType: Type, public readonly returnType: Type) {
    super();
  }
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
  public contains(typeVar: TypeVariable): boolean {
    return this.argumentType.contains(typeVar) || this.returnType.contains(typeVar);
  }
  public substitute(typeVar: TypeVariable, targetType: Type): Type {
    return new FunctionType(
      this.argumentType.substitute(typeVar, targetType),
      this.returnType.substitute(typeVar, targetType),
    );
  }
}
