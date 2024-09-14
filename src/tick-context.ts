import { WritableDraft } from 'immer'
import invariant from 'tiny-invariant'
import { getVariableValue } from './get-variable-value'
import {
  Condition,
  Context,
  Item,
  ItemLocation,
  ItemType,
  Operator,
  Variable,
} from './types'

export function tickContext(draft: WritableDraft<Context>) {
  draft.tick += 1
  const itemsToDelete = new Set<Item>()
  for (const item of draft.items.filter(isInQueue)) {
    if (isConditionSatisfied(item.condition, draft)) {
      switch (item.type) {
        case ItemType.enum.Stone:
        case ItemType.enum.Wood: {
          draft.inventory[item.type] =
            (draft.inventory[item.type] ?? 0) + 1
          break
        }
        case ItemType.enum.StoneFurnace: {
          if (
            (draft.inventory[ItemType.enum.Stone] ?? 0) >= 2
          ) {
            draft.inventory[ItemType.enum.Stone]! -= 2
            draft.inventory[ItemType.enum.StoneBrick] =
              (draft.inventory[ItemType.enum.StoneBrick] ??
                0) + 1
          }
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

  draft.items = draft.items.filter(
    (item) => !itemsToDelete.has(item),
  )
}

function isInQueue(item: Item): boolean {
  return item.location === ItemLocation.enum.Queue
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
