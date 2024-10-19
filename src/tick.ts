import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import { ActionType, ItemType, State } from './state'

export function tick(setState: Updater<State>) {
  setState((draft) => {
    draft.tick += 1

    const head = draft.queue.at(0)
    if (!head) {
      return
    }

    switch (head.type) {
      case ActionType.enum.Mine: {
        invariant(head.progress >= 0)
        head.progress += 1

        const target = head.count * 10
        invariant(head.progress <= target)

        if (head.progress % 10 === 0) {
          draft.inventory[head.item] =
            (draft.inventory[head.item] ?? 0) + 1
        }

        if (head.progress === target) {
          draft.queue.shift()
        }
        break
      }
      case ActionType.enum.Craft: {
        invariant(head.progress >= 0)
        invariant(head.count === 1)

        head.progress += 1

        invariant(head.progress <= 20)

        if (head.progress === 20) {
          draft.inventory[head.item] =
            (draft.inventory[head.item] ?? 0) + 1
          draft.queue.shift()
        }
        break
      }
      case ActionType.enum.Smelt: {
        invariant(head.progress >= 0)
        head.progress += 1

        const target = head.count * 20
        invariant(head.progress <= target)

        if (head.progress % 20 === 0) {
          draft.inventory[head.item] =
            (draft.inventory[head.item] ?? 0) + 1
        }

        if (head.progress === target) {
          draft.queue.shift()

          draft.inventory[ItemType.enum.StoneFurnace] =
            (draft.inventory[ItemType.enum.StoneFurnace] ??
              0) + 1
        }
        break
      }
      default: {
        invariant(false, 'TODO')
      }
    }
  })
}
