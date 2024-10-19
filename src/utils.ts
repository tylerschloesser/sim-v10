import invariant from 'tiny-invariant'
import { Action, ActionType } from './state'

export function getActionLabel(action: Action): string {
  switch (action.type) {
    case ActionType.enum.Mine: {
      if (action.count === 1) {
        return `Mine ${action.item}`
      }
      return `Mine ${action.item} (${action.count})`
    }
    case ActionType.enum.Craft: {
      return `Craft ${action.item}`
    }
    case ActionType.enum.Smelt: {
      if (action.count === 1) {
        return `Smelt ${action.item}`
      }
      return `Smelt ${action.item} (${action.count})`
    }
    default: {
      invariant(false, 'TODO')
    }
  }
}
