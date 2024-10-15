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
  ItemType,
  State,
} from './state'

const TICK_RATE = 100

function tick(setState: Updater<State>) {
  setState((draft) => {
    draft.tick += 1

    const head = draft.queue[0]
    if (!head) {
      return
    }

    switch (head.type) {
      case ActionType.enum.Mine: {
        invariant(head.progress >= 0)
        head.progress += 1
        invariant(head.progress <= 10)
        if (head.progress === 10) {
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
              <div>
                <MineButton item={ItemType.enum.Coal} />
                <MineButton item={ItemType.enum.Stone} />
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
              <div key={i} className="border p-2 relative">
                <div
                  className="absolute bg-green-800 top-0 left-0 bottom-0 right-0 transition-transform ease-linear origin-left"
                  style={{
                    transform: `scale(${action.progress / 10}, 1)`,
                  }}
                />
                <div className="relative">
                  {getActionLabel(action)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppContext.Provider>
  )
}

function getActionLabel(action: Action): string {
  switch (action.type) {
    case ActionType.enum.Mine: {
      return `Mine ${action.item}`
    }
    default: {
      invariant(false, 'TODO')
    }
  }
}

interface MineButtonProps {
  item: ItemType
}

function MineButton({ item }: MineButtonProps) {
  const { setState } = useContext(AppContext)
  const onClick = useCallback(() => {
    setState((draft) => {
      draft.queue.push({
        type: ActionType.enum.Mine,
        item,
        progress: 0,
      })
    })
  }, [setState])
  return <Button onClick={onClick}>Mine {item}</Button>
}

type ButtonProps = React.PropsWithChildren<{
  onClick(): void
}>

function Button({ children, onClick }: ButtonProps) {
  return (
    <button
      className="border p-2 hover:opacity-75 active:opacity-50"
      onClick={onClick}
    >
      {children}
    </button>
  )
}
