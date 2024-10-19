import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import {
  ActionType,
  CraftAction,
  ItemType,
  MineAction,
  SmeltAction,
  State,
} from './state'

type HandleActionResult = { complete: boolean }

export function tick(setState: Updater<State>) {
  setState((draft) => {
    draft.tick += 1
    tickQueue(draft)
  })
}

function tickQueue(draft: State) {
  const head = draft.queue.at(0)
  if (!head) {
    return
  }

  let result: HandleActionResult | undefined
  switch (head.type) {
    case ActionType.enum.Mine: {
      result = handleMine(head, draft)
      break
    }
    case ActionType.enum.Craft: {
      result = handleCraft(head, draft)
      break
    }
    case ActionType.enum.Smelt: {
      result = handleSmelt(head, draft)
      break
    }
    default: {
      invariant(false, 'TODO')
    }
  }

  if (result?.complete) {
    draft.queue.shift()
  }
}

function handleMine(
  action: MineAction,
  draft: State,
): HandleActionResult {
  invariant(action.progress >= 0)
  action.progress += 1

  const target = action.count * 10
  invariant(action.progress <= target)

  if (action.progress % 10 === 0) {
    draft.inventory[action.item] =
      (draft.inventory[action.item] ?? 0) + 1
  }

  const complete = action.progress === target

  return { complete }
}

function handleCraft(
  action: CraftAction,
  draft: State,
): HandleActionResult {
  invariant(action.progress >= 0)
  invariant(action.count === 1)

  action.progress += 1

  invariant(action.progress <= 20)

  const complete = action.progress === 20

  if (complete) {
    draft.inventory[action.item] =
      (draft.inventory[action.item] ?? 0) + 1
  }

  return { complete }
}

function handleSmelt(
  action: SmeltAction,
  draft: State,
): HandleActionResult {
  invariant(action.progress >= 0)
  action.progress += 1

  const target = action.count * 20
  invariant(action.progress <= target)

  if (action.progress % 20 === 0) {
    draft.inventory[action.item] =
      (draft.inventory[action.item] ?? 0) + 1
  }

  const complete = action.progress === target
  if (complete) {
    draft.inventory[ItemType.enum.StoneFurnace] =
      (draft.inventory[ItemType.enum.StoneFurnace] ?? 0) + 1
  }

  return { complete }
}
