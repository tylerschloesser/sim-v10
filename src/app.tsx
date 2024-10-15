import React, {
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react'
import invariant from 'tiny-invariant'
import { Updater, useImmer } from 'use-immer'
import { AppContext } from './app-context'
import {
  Action,
  ActionType,
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

const INITIAL_STATE: State = {
  tick: 0,
  inventory: {},
  queue: [],
}

export function App() {
  const [state, setState] = useImmer<State>(INITIAL_STATE)

  useTick(setState)

  return (
    <AppContext.Provider
      value={useMemo(
        () => ({ state, setState }),
        [state, setState],
      )}
    >
      <div className="p-2">
        <div className="flex flex-col gap-2">
          <div className="flex flex-row gap-2">
            <div className="flex flex-col gap-2">
              <div className="opacity-50">
                tick: {state.tick}
              </div>
              <div className="flex">
                <MineButton item={ItemType.enum.Coal} />
                <MineButton item={ItemType.enum.Stone} />
              </div>
              <div className="flex">
                <CraftButton
                  item={ItemType.enum.StoneFurnace}
                />
              </div>
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
    default: {
      invariant(false, 'TODO')
    }
  }
}

interface MineButtonProps {
  item:
    | typeof ItemType.enum.Coal
    | typeof ItemType.enum.Stone
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
  return <Button onClick={onClick}>Mine {item}</Button>
}

interface CraftButtonProps {
  item: typeof ItemType.enum.StoneFurnace
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
      draft.queue.push({
        type: ActionType.enum.Craft,
        item,
        count: 1,
        progress: 0,
      })
    })
  }, [item, setState])
  return (
    <Button onClick={onClick} disabled={disabled}>
      Craft {item}
    </Button>
  )
}

type ButtonProps = React.PropsWithChildren<{
  onClick(): void
  disabled?: boolean
}>

function Button({
  children,
  onClick,
  disabled = false,
}: ButtonProps) {
  return (
    <button
      className="border p-2 hover:opacity-75 active:opacity-50 disabled:opacity-25"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
