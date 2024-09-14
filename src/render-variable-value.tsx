import { useMemo } from 'react'
import invariant from 'tiny-invariant'
import {
  Context,
  CustomVariableFunctionType,
  FunctionInput,
  FunctionInputType,
  Variable,
  VariableType,
} from './types'

export interface VariableValueProps {
  variable: Variable
  context: Context
}

export function RenderVariableValue({
  variable,
  context,
}: VariableValueProps) {
  const value = useMemo(
    () => getVariableValue(variable, context),
    [variable, context],
  )
  return <>{JSON.stringify(value)}</>
}

function getVariableValue(
  variable: Variable,
  context: Context,
): number {
  switch (variable.type) {
    case VariableType.enum.Item:
      return context.inventory[variable.item] ?? 0
    case VariableType.enum.Custom: {
      switch (variable.fn.type) {
        case CustomVariableFunctionType.enum.Identity: {
          return getFunctionInputValue(
            variable.fn.input,
            context,
          )
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
