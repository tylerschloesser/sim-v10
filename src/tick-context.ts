import { WritableDraft } from 'immer'
import invariant from 'tiny-invariant'
import { getVariableValue } from './get-variable-value'
import {
  ActionType,
  Condition,
  Context,
  Operator,
  Variable,
} from './types'

export function tickContext(draft: WritableDraft<Context>) {
  draft.tick += 1
  for (const action of Object.values(draft.actions)) {
    if (action.output === null) {
      continue
    }
    if (isConditionSatisfied(action.condition, draft)) {
      switch (action.type) {
        case ActionType.enum.GatherStone:
        case ActionType.enum.GatherWood: {
          const output = draft.stores[action.output]
          invariant(output)
          output.quantity += 1
          break
        }
        default:
          invariant(false)
      }

      // TODO
      // only allow a single item to be processed per tick
      break
    }
  }
}

function isConditionSatisfied(
  condition: Condition | null,
  context: Context,
): boolean {
  if (condition === null) {
    return true
  }
  const inputs: [number, number] = [
    getVariableValue(
      getVariable(condition.inputs[0], context),
      context,
    ),
    getVariableValue(
      getVariable(condition.inputs[1], context),
      context,
    ),
  ]
  const operator = condition.operator
  const [left, right] = inputs
  return (
    (operator === Operator.enum.lt && left < right) ||
    (operator === Operator.enum.lte && left <= right) ||
    (operator === Operator.enum.gt && left > right) ||
    (operator === Operator.enum.gte && left >= right) ||
    (operator === Operator.enum.eq && left === right)
  )
}

function getVariable(
  id: string,
  context: Context,
): Variable {
  const variable = context.variables[id]
  invariant(variable)
  return variable
}
