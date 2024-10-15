import React, {
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
      <div className="flex flex-col p-2 gap-2">
        <div className="opacity-50">
          tick: {state.tick} queue: {state.queue.length}
        </div>
        <div>
          <MineButton />
        </div>
      </div>
    </AppContext.Provider>
  )
}

function MineButton() {
  const { setState } = useContext(AppContext)
  const onClick = useCallback(() => {
    setState((draft) => {
      draft.queue.push({
        type: ActionType.enum.Mine,
        item: ItemType.enum.Coal,
      })
    })
  }, [setState])
  return <Button onClick={onClick}>Mine Coal</Button>
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
