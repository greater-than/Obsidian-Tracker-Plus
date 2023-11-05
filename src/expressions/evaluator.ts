import jsep from 'jsep';
import {
  DeprecatedVariableError,
  FunctionError,
  Reason,
  TrackerError,
} from '../errors';
import { Dataset } from '../models/dataset';
import { RenderInfo } from '../models/render-info';
import { BinaryOperation } from './binary-operation';
import { DatasetToDataset } from './dataset-to-dataset';
import { DatasetToValue } from './dataset-to-value';
import { ValidExpression } from './enums';
import { UnaryOperation, validateBinaryOperands } from './unary-operation';
import Moment = moment.Moment;
import Expression = jsep.Expression;

export function evaluate(
  expressions: Expression[],
  renderInfo: RenderInfo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function evaluate(expression: Expression, renderInfo: RenderInfo): any;
export function evaluate(
  expression: Expression | Expression[],
  renderInfo: RenderInfo
):
  | string
  | string[]
  | number
  | number[]
  | boolean
  | boolean[]
  | Dataset
  | Dataset[]
  | RegExp
  | RegExp[]
  | Moment
  | Moment[] {
  if (Array.isArray(expression))
    return expression.map((expr: Expression) => evaluate(expr, renderInfo));
  switch (expression.type) {
    case ValidExpression.LITERAL:
      return (expression as jsep.Literal).value; // string, number, boolean

    case ValidExpression.IDENTIFIER:
      const expr = expression as jsep.Identifier;
      const { name } = expr;
      if (name in DatasetToValue || name in DatasetToDataset)
        throw new DeprecatedVariableError(name);
      else throw new TrackerError(`Function '${name}' is unknown`);

    case ValidExpression.UNARY:
      const unaryExpr = expression as jsep.UnaryExpression;
      const arg = evaluate(unaryExpr.argument, renderInfo);
      return UnaryOperation[unaryExpr.operator](arg);

    case ValidExpression.BINARY:
      const binaryExpr = expression as jsep.BinaryExpression;
      const leftOperand = evaluate(binaryExpr.left, renderInfo);
      const rightOperand = evaluate(binaryExpr.right, renderInfo);
      validateBinaryOperands(leftOperand, rightOperand);
      return BinaryOperation[binaryExpr.operator](leftOperand, rightOperand);

    case ValidExpression.CALL:
      const callExpr = expression as jsep.CallExpression;
      const calleeName = (callExpr.callee as jsep.Identifier).name;
      const args = evaluate(callExpr.arguments, renderInfo);

      if (calleeName === 'dataset') {
        const id = args.length === 1 ? args[0] : undefined;
        const dataset =
          typeof id === 'number'
            ? renderInfo.datasets.getDatasetById(id)
            : undefined;

        if (!dataset) throw new TrackerError(`Dataset id '${id}' not found`);
        return dataset;
      }

      if (calleeName in DatasetToValue) {
        if (args.length === 0) {
          // Use first non-X dataset
          let dataset = null;
          for (const ds of renderInfo.datasets) {
            // if breaks here, the index of Datasets not reset???
            if (!dataset && !ds.query.usedAsXDataset) dataset = ds;
          }
          if (dataset) return DatasetToValue[calleeName](dataset, renderInfo);
          throw new FunctionError(calleeName, Reason.DATASET_NOT_FOUND);
        }
        if (args.length === 1) {
          if (!(args[0] instanceof Dataset))
            throw new FunctionError(calleeName, Reason.NOT_DATASET_ARG);

          return DatasetToValue[calleeName](args[0], renderInfo);
        }
        throw new FunctionError(calleeName, Reason.TOO_MANY_ARGS);
      }
      if (calleeName in DatasetToDataset) {
        if (args.length === 1) {
          if (!(args[0] instanceof Dataset))
            throw new FunctionError(calleeName, Reason.NOT_DATASET_ARG);
          return DatasetToDataset[calleeName](args[0], null, renderInfo);
        }
        if (args.length > 1) {
          if (!(args[0] instanceof Dataset))
            throw new FunctionError(calleeName, Reason.NOT_DATASET_ARG);
          return DatasetToDataset[calleeName](
            args[0],
            args.filter((_arg: undefined, index: number) => index > 0),
            renderInfo
          );
        }
        throw new FunctionError(calleeName, Reason.TOO_MANY_ARGS);
      }
      throw new FunctionError(calleeName, Reason.IS_UNKNOWN);
    default:
      throw new TrackerError('Unknown expression');
  }
}
