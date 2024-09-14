import { useMemo } from 'react'
import invariant from 'tiny-invariant'
import {
  Context,
  CustomVariableFunctionType,
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
) {
  switch (variable.type) {
    case VariableType.enum.Item:
      return context.inventory[variable.item] ?? 0
    case VariableType.enum.Custom: {
      switch (variable.fn.type) {
        case CustomVariableFunctionType.enum.Identity: {
          switch (variable.fn.input.type) {
            case FunctionInputType.enum.Constant:
              return variable.fn.input.value
            case FunctionInputType.enum.Variable: {
              const input =
                context.variables[variable.fn.input.id]
              invariant(input)
              return getVariableValue(input, context)
            }
          }
        }
        default:
          invariant(false)
      }
    }
  }
}
