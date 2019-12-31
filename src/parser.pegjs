{
  const T = require("./expression");
}

Input
  = _ expression:Expression
    { return expression; }

// Keyword

IfKeyword = "if" !IdentifierPart
ThenKeyword = "then" !IdentifierPart
ElseKeyword = "else" !IdentifierPart
LetKeyword = "let" !IdentifierPart
InKeyword = "in" !IdentifierPart

Expression
  = Abstraction
  / Application
  / Condition
  / Let
  / Literal
  / Variable

Abstraction
  = "\\" parameter:Variable _ "->" _ body:Expression
    { return new T.Abstraction(parameter, body); }

Application
  = "(" _
    callee:Expression _
    args:(head:Expression tail:(_ item:Expression { return item; })* { return [head].concat(tail); })
    ")"
    {
      let application = new T.Application(callee, args.shift());
      while (args.length > 0) {
        application = new T.Application(application, args.shift());
      }
      return application;
    }

Condition
  = IfKeyword __ condition:Expression _
    ThenKeyword __ consequence:Expression _
    ElseKeyword __ alternative:Expression
    { return new T.Condition(condition, consequence, alternative) };

Let
  = LetKeyword _ name:Variable _ "=" _ expression:Expression _
    InKeyword _ body:Expression
    { return new T.Let(name, expression, body)}

Variable
  = name:Identifier
    { return new T.Variable(name); }

// 2.5 Literal

Literal
  = BooleanLiteral
  / NumericLiteral
  / StringLiteral

// 2.5.1 Boolean

BooleanLiteral
  = TrueLiteral
  / FalseLiteral

TrueLiteral "true"
  = "true" !IdentifierPart _
    { return new T.Literal(true); }

FalseLiteral "false"
  = "false" !IdentifierPart _
    { return new T.Literal(false); }

// 2.5.2 Number

NumericLiteral "number"
  = x:HexIntegerLiteral _
    { return x; }
  / x:OctIntegerLiteral _
    { return x; }
  / x:BinIntegerLiteral _
    { return x; }
  / x:DecimalLiteral _
    { return x; }

HexIntegerLiteral
  = "0x" digits:HexDigit+
    { return new T.Literal(parseInt(digits, 16)); }

HexDigit
  = [0-9A-Fa-f]

OctIntegerLiteral
  = "0o" digits:OctDigit+
    { return new T.Literal(parseInt(digits, 8)); }

OctDigit
  = [0-8]

BinIntegerLiteral
  = "0b" digits:BinDigit+
    { return new T.Literal(parseInt(digits, 2)); }

BinDigit
  = [01]

DecimalLiteral
  = DecimalIntegerLiteral "." DecimalDigit* ExponentPart?
    { return new T.Literal(parseFloat(text())); }
  / "." DecimalDigit+ ExponentPart?
    { return new T.Literal(parseFloat(text())); }
  / i:$DecimalIntegerLiteral e:ExponentPart?
    { return new T.Literal(e ? parseFloat(text()) : parseInt(i, 10)); }

DecimalIntegerLiteral
  = "0"
  / NonZeroDigit DecimalDigit*

NonZeroDigit
  = [1-9]

DecimalDigit
  = [0-9]

ExponentPart
  = [Ee] [+-]? DecimalDigit+

// 2.5.3 String

StringLiteral "string"
  = t:DoubleQuoteString _
    { return t; }
  / t:SingleQuoteString _
    { return t; }

// ------

DoubleQuoteString
  = DQ chars:CharOfDoubleQuoteString* DQ
    { return new T.Literal(chars.join("")); }

SingleQuoteString
  = SQ chars:CharOfSingleQuoteString* SQ
    { return new T.Literal(chars.join("")); }

// ------

DQ = '"'
SQ = "'"

CharOfDoubleQuoteString
  = !(DQ / "\\" / LineTerminator) c:.
    { return c; }
  / CommonCharOfString

CharOfSingleQuoteString
  = !(SQ / "\\" / LineTerminator) c:.
    { return c; }
  / CommonCharOfString

// ------

CommonCharOfString
  = "\\" sequence:EscapeSequence
    { return sequence; }
  / LineContinuation
    { return ""; }

// ------

EscapeSequence
  = CharacterEscapeSequence
  / "0" !DecimalDigit
    { return "\0"; }
  / "x" digits:$(HexDigit HexDigit)
    { return String.fromCharCode(parseInt(digits, 16)); }
  / "u" digits:$(HexDigit HexDigit HexDigit HexDigit)
    { return String.fromCharCode(parseInt(digits, 16)); }

LineContinuation
  = "\\" LineTerminatorSequence
    { return ""; }

// ------

CharacterEscapeSequence
  = SingleEscapeCharacter
  / NonEscapeCharacter

// ------

SingleEscapeCharacter
  = DQ
  / SQ
  / "\\"
  / "b" { return "\b"; }
  / "f" { return "\f"; }
  / "n" { return "\n"; }
  / "r" { return "\r"; }
  / "t" { return "\t"; }
  / "v" { return "\v"; }

NonEscapeCharacter
  = !(EscapeCharacter / LineTerminator) .
    { return text(); }

// ------

EscapeCharacter
  = SingleEscapeCharacter
  / DecimalDigit
  / "x"
  / "u"

Identifier "identifier"
  = IdentifierStart IdentifierPart*
    { return text(); }

IdentifierStart
  = [A-Za-z_]

IdentifierPart
  = [A-Za-z0-9_]

// Space

_
  = (WhiteSpace / LineTerminatorSequence / Comment)*

__
  = (WhiteSpace / LineTerminatorSequence / Comment)+

LineTerminator
  = [\n\r\u2028\u2029]

LineTerminatorSequence "eol"
  = "\n"
  / "\r\n"
  / "\r"
  / "\u2028"
  / "\u2029"

WhiteSpace "whitespace"
  = "\t"
  / "\v"
  / "\f"
  / " "
  / "\u00A0"
  / "\uFEFF"
  / [\u0020\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]

// Comment

Comment "comment"
  = MultiLineComment
  / SingleLineComment

MultiLineComment
  = "/*" (!"*/" .)* "*/"

SingleLineComment
  = "//" (!LineTerminator .)*
