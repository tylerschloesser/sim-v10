import invariant from 'tiny-invariant'
import { ActionType, ItemType } from './types'

export function getActionItemType(
  action: ActionType,
): ItemType {
  switch (action) {
    case ActionType.enum.GatherStone:
      return ItemType.enum.Stone
    case ActionType.enum.GatherWood:
      return ItemType.enum.Wood
    default:
      invariant(false)
  }
}
