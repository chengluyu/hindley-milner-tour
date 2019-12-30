import * as E from './expression';
import * as T from './type';
import Annotator from './annotator';
import Equation from './constraint';

export default class Collector extends E.ExpressionVisitor {
  private equations: Equation[] = [];

  public constructor(private readonly annotator: Annotator) {
    super();
  }

  public getEquations(): Equation[] {
    return this.equations;
  }

  public display(): void {
    for (const equation of this.equations) {
      console.log(equation.toString());
    }
  }

  public visitLiteral(x: E.Literal): void {
    if (typeof x.value === 'boolean') {
      this.equations.push(new Equation(this.annotator.getType(x), T.booleanType));
    } else if (typeof x.value === 'number') {
      this.equations.push(new Equation(this.annotator.getType(x), T.integerType));
    } else if (typeof x.value === 'string') {
      this.equations.push(new Equation(this.annotator.getType(x), T.stringType));
    } else {
      throw new Error(`illegal literal type: "${typeof x.value}"`);
    }
  }

  public visitVariable(/* x: E.Variable */): void {
    return;
  }

  public visitAbstraction(x: E.Abstraction): void {
    this.visit(x.body);
    this.equations.push(
      new Equation(
        this.annotator.getType(x),
        new T.FunctionType(this.annotator.getType(x.parameter), this.annotator.getType(x.body)),
      ),
    );
  }

  public visitApplication(x: E.Application): void {
    this.visit(x.callee);
    this.visit(x.argument);
    this.equations.push(
      new Equation(
        this.annotator.getType(x.callee),
        new T.FunctionType(this.annotator.getType(x.argument), this.annotator.getType(x)),
      ),
    );
  }

  public visitCondition(x: E.Condition): void {
    this.visit(x.condition);
    this.visit(x.consequence);
    this.visit(x.alternative);
    this.equations.push(new Equation(this.annotator.getType(x.condition), T.booleanType));
    this.equations.push(
      new Equation(this.annotator.getType(x), this.annotator.getType(x.consequence)),
    );
    this.equations.push(
      new Equation(this.annotator.getType(x), this.annotator.getType(x.alternative)),
    );
  }

  public visitLet(x: E.Let): void {
    this.visit(x.value);
    this.visit(x.body);
    this.equations.push(new Equation(this.annotator.getType(x), this.annotator.getType(x.body)));
    this.equations.push(
      new Equation(this.annotator.getType(x.name), this.annotator.getType(x.value)),
    );
  }
}
