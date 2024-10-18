import {
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react'
import invariant from 'tiny-invariant'
import { Updater, useImmer } from 'use-immer'
import { AppContext, Modal } from './app-context'
import { Button } from './button'
import {
  RobotDialog,
  RobotDialogTrigger,
} from './robot-dialog'
import {
  Action,
  ActionType,
  Inventory,
  ITEM_TYPE_TO_RECIPE,
  ItemType,
  State,
} from './state'

const TICK_RATE = 100

function tick(setState: Updater<State>) {
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

function useTick(setState: Updater<State>) {
  useEffect(() => {
    const interval = self.setInterval(
      () => tick(setState),
      TICK_RATE,
    )
    return () => {
      self.clearInterval(interval)
    }
  }, [setState])
}

const INITIAL_INVENTORY: Inventory = {
  [ItemType.enum.Stone]: 20,
  [ItemType.enum.IronPlate]: 20,
  [ItemType.enum.Robot]: 1,
}

const INITIAL_STATE: State = {
  tick: 0,
  inventory: INITIAL_INVENTORY,
  queue: [],
  robots: {},
  nextRobotId: 0,
}

export function App() {
  const [state, setState] = useImmer<State>(INITIAL_STATE)
  const [modal, setModal] = useImmer<Modal | null>(null)

  useTick(setState)

  return (
    <AppContext.Provider
      value={useMemo(
        () => ({ state, setState, modal, setModal }),
        [state, setState, modal, setModal],
      )}
    >
      <div className="p-2">
        <div className="flex flex-col gap-2">
          <div className="flex flex-row gap-2">
            <div className="flex flex-col gap-2">
              <div className="opacity-50">
                tick: {state.tick}
              </div>
              <h2>Mine</h2>
              <div className="flex">
                <MineButton item={ItemType.enum.Coal} />
                <MineButton item={ItemType.enum.Stone} />
                <MineButton item={ItemType.enum.IronOre} />
              </div>
              <h2>Craft</h2>
              <div className="flex">
                <CraftButton
                  item={ItemType.enum.StoneFurnace}
                />
                <CraftButton
                  item={ItemType.enum.BurnerMiningDrill}
                />
                <CraftButton item={ItemType.enum.Robot} />
              </div>
              <h2>Smelt</h2>
              <div className="flex">
                <SmeltButton
                  item={ItemType.enum.IronPlate}
                />
              </div>
              <h2>Robots</h2>
              <RobotDialog
                trigger={<Button>Add Robot</Button>}
              />
              {Object.values(state.robots).map((robot) => (
                <div key={robot.id} className="flex gap-2">
                  <div>{robot.name}</div>
                  <div>Edit</div>
                </div>
              ))}
            </div>
            <div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(state.inventory).map(
                  ([item, count]) => (
                    <Fragment key={item}>
                      <div>{item}</div>
                      <div>{count}</div>
                    </Fragment>
                  ),
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {state.queue.map((action, i) => (
              <RenderAction
                key={i}
                action={action}
                index={i}
              />
            ))}
          </div>
        </div>
      </div>
    </AppContext.Provider>
  )
}

interface RenderActionProps {
  action: Action
  index: number
}

function RenderAction({
  action,
  index,
}: RenderActionProps) {
  const { setState } = useContext(AppContext)

  const onClickDelete = useCallback(() => {
    setState((draft) => {
      draft.queue.splice(index, 1)
    })
  }, [index, setState])

  const target = useMemo(() => {
    switch (action.type) {
      case ActionType.enum.Mine: {
        return action.count * 10
      }
      case ActionType.enum.Craft: {
        return 20
      }
      case ActionType.enum.Smelt: {
        return action.count * 20
      }
      default: {
        invariant(false, 'TODO')
      }
    }
  }, [action])

  return (
    <div className="border p-2 relative">
      <div
        className="absolute bg-green-800 top-0 left-0 bottom-0 right-0 transition-transform ease-linear origin-left"
        style={{
          transform: `scale(${action.progress / target}, 1)`,
        }}
      />
      <div className="relative flex justify-between">
        <div>{getActionLabel(action)}</div>
        <div>
          <button
            className="underline"
            onClick={onClickDelete}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function getActionLabel(action: Action): string {
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

interface MineButtonProps {
  item:
    | typeof ItemType.enum.Coal
    | typeof ItemType.enum.Stone
    | typeof ItemType.enum.IronOre
}

function MineButton({ item }: MineButtonProps) {
  const { setState } = useContext(AppContext)
  const onClick = useCallback(() => {
    setState((draft) => {
      const tail = draft.queue.at(-1)
      if (tail?.item === item) {
        tail.count += 1
        return
      }
      draft.queue.push({
        type: ActionType.enum.Mine,
        item,
        count: 1,
        progress: 0,
      })
    })
  }, [setState])
  return <Button onClick={onClick}>{item}</Button>
}

interface CraftButtonProps {
  item:
    | typeof ItemType.enum.StoneFurnace
    | typeof ItemType.enum.BurnerMiningDrill
    | typeof ItemType.enum.Robot
}

function CraftButton({ item }: CraftButtonProps) {
  const { state, setState } = useContext(AppContext)

  const recipe = useMemo(
    () => ITEM_TYPE_TO_RECIPE[item],
    [item],
  )

  const disabled = useMemo(() => {
    return Object.entries(recipe).some(
      ([key, count]) =>
        (state.inventory[ItemType.parse(key)] ?? 0) < count,
    )
  }, [state.inventory, recipe])

  const onClick = useCallback(() => {
    setState((draft) => {
      for (const [key, count] of Object.entries(recipe)) {
        const item = ItemType.parse(key)
        invariant(draft.inventory[item]! >= count)
        draft.inventory[item]! -= count
        if (draft.inventory[item] === 0) {
          delete draft.inventory[item]
        }
      }

      draft.queue.push({
        type: ActionType.enum.Craft,
        item,
        count: 1,
        progress: 0,
      })
    })
  }, [item, setState, recipe])
  return (
    <Button onClick={onClick} disabled={disabled}>
      {item}
    </Button>
  )
}

interface SmeltButtonProps {
  item: typeof ItemType.enum.IronPlate
}

function SmeltButton({ item }: SmeltButtonProps) {
  const { state, setState } = useContext(AppContext)

  const recipe = useMemo(
    () => ({
      [ItemType.enum.IronOre]: 1,
      [ItemType.enum.Coal]: 1,
    }),
    [],
  )

  const disabled = useMemo(() => {
    if (
      Object.entries(recipe).some(
        ([key, count]) =>
          (state.inventory[ItemType.parse(key)] ?? 0) <
          count,
      )
    ) {
      return true
    }

    const tail = state.queue.at(-1)
    if (
      tail?.type === ActionType.enum.Smelt &&
      tail.item === item
    ) {
      return false
    }

    return (
      (state.inventory[ItemType.enum.StoneFurnace] ?? 0) ===
      0
    )
  }, [state.inventory, state.queue, recipe])

  const onClick = useCallback(() => {
    setState((draft) => {
      for (const [key, count] of Object.entries(recipe)) {
        const item = ItemType.parse(key)
        invariant(draft.inventory[item]! >= count)
        draft.inventory[item]! -= count
        if (draft.inventory[item] === 0) {
          delete draft.inventory[item]
        }
      }

      const tail = draft.queue.at(-1)
      if (
        tail?.type === ActionType.enum.Smelt &&
        tail.item === item
      ) {
        tail.count += 1
      } else {
        invariant(
          draft.inventory[ItemType.enum.StoneFurnace]! > 0,
        )
        draft.inventory[ItemType.enum.StoneFurnace]! -= 1
        if (
          draft.inventory[ItemType.enum.StoneFurnace] === 0
        ) {
          delete draft.inventory[ItemType.enum.StoneFurnace]
        }

        draft.queue.push({
          type: ActionType.enum.Smelt,
          item,
          count: 1,
          progress: 0,
        })
      }
    })
  }, [setState, recipe])

  return (
    <Button onClick={onClick} disabled={disabled}>
      {item}
    </Button>
  )
}
