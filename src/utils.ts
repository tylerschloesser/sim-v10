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

export function getActionTarget(action: Action): number {
  let target: number
  switch (action.type) {
    case ActionType.enum.Mine: {
      target = action.count * 10
      break
    }
    case ActionType.enum.Craft: {
      target = 20
      break
    }
    case ActionType.enum.Smelt: {
      target = action.count * 20
      break
    }
    default: {
      invariant(false, 'TODO')
    }
  }
  invariant(target > 0)
  return target
}

export function multiplyRecipe(
  recipe: Record<string, number>,
  count: number,
): Record<string, number> {
  invariant(count > 0)
  invariant(Number.isInteger(count))

  const result: Record<string, number> = {}
  for (const [key, value] of Object.entries(recipe)) {
    result[key] = value * count
  }
  return result
}
