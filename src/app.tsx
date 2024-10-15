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
import { ActionType, ItemType, State } from './state'

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
                tick: {state.tick} queue:{' '}
                {state.queue.length}
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
          <div>Test</div>
        </div>
      </div>
    </AppContext.Provider>
  )
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
