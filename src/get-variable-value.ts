import invariant from 'tiny-invariant'
import {
  Context,
  CustomVariableFunctionType,
  FunctionInput,
  FunctionInputType,
  Variable,
  VariableType,
} from './types'

export function getVariableValue(
  variable: Variable,
  context: Context,
): number {
  switch (variable.type) {
    case VariableType.enum.Item:
      // TODO
      return 0
    case VariableType.enum.Custom: {
      switch (variable.fn.type) {
        case CustomVariableFunctionType.enum.Identity: {
          return getFunctionInputValue(
            variable.fn.input,
            context,
          )
        }
        case CustomVariableFunctionType.enum.Multiply: {
          const left = getFunctionInputValue(
            variable.fn.inputs[0],
            context,
          )
          const right = getFunctionInputValue(
            variable.fn.inputs[1],
            context,
          )
          return left * right
        }
        default:
          invariant(false)
      }
    }
  }
}

function getFunctionInputValue(
  input: FunctionInput,
  context: Context,
): number {
  switch (input.type) {
    case FunctionInputType.enum.Constant:
      return input.value
    case FunctionInputType.enum.Variable: {
      const variable = context.variables[input.id]
      invariant(input)
      return getVariableValue(variable, context)
    }
    default:
      invariant(false)
  }
}
