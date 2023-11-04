export enum UnaryOperator {
  NEGATIVE = '-',
  POSITIVE = '+',
}

export enum BinaryOperator {
  ADD = '+',
  SUBTRACT = '-',
  MULTIPLY = '*',
  DIVIDE = '/',
  MOD = '%',
}

export enum ValidExpression {
  LITERAL = 'Literal',
  IDENTIFIER = 'Identifier',
  UNARY = 'UnaryExpression',
  BINARY = 'BinaryExpression',
  CALL = 'CallExpression',
}
