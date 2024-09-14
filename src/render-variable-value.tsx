import { useMemo } from 'react'
import { getVariableValue } from './get-variable-value'
import { Context, Variable } from './types'

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
