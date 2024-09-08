import { WritableDraft } from 'immer'
import shortId from 'short-uuid'
import invariant from 'tiny-invariant'
import {
  Condition,
  Inventory,
  Item,
  ItemLocation,
  ItemType,
  Operator,
  State,
  Value,
  ValueType,
} from './types'

export function tickState(draft: WritableDraft<State>) {
  draft.tick += 1
  const itemsToDelete = new Set<Item>()
  for (const item of draft.items.filter(isInQueue)) {
    if (
      isConditionSatisfied(item.condition, draft.inventory)
    ) {
      switch (item.type) {
        case ItemType.enum.Stone:
        case ItemType.enum.Wood: {
          draft.inventory[item.type] =
            (draft.inventory[item.type] ?? 0) + 1
          break
        }
        case ItemType.enum.ResearchStone: {
          item.progress += 1
          if (item.progress === 100) {
            draft.items.push({
              id: shortId.generate(),
              location: ItemLocation.enum.Available,
              type: ItemType.enum.StoneFurnace,
              condition: null,
            })
            itemsToDelete.add(item)
          }
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
  inventory: Partial<Record<ItemType, number>>,
): boolean {
  if (condition === null) {
    return true
  }
  const left = getValue(condition.left, inventory)
  const right = getValue(condition.right, inventory)
  const operator = condition.operator
  return (
    (operator === Operator.enum.lt && left < right) ||
    (operator === Operator.enum.lte && left <= right) ||
    (operator === Operator.enum.gt && left > right) ||
    (operator === Operator.enum.gte && left >= right) ||
    (operator === Operator.enum.eq && left === right)
  )
}

function getValue(
  value: Value,
  inventory: Inventory,
): number {
  switch (value.type) {
    case ValueType.enum.Variable: {
      const itemType = ItemType.parse(value.variable)
      return inventory[itemType] ?? 0
    }
    case ValueType.enum.Constant: {
      return value.constant
    }
    default:
      invariant(false)
  }
}
