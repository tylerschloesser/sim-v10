import { useEffect } from 'react'
import { Updater, useImmer } from 'use-immer'
import { State } from './state'

const TICK_RATE = 100

function tick(setState: Updater<State>) {
  setState((draft) => {
    draft.tick += 1
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
}

export function App() {
  const [state, setState] = useImmer<State>(INITIAL_STATE)

  useTick(setState)

  return (
    <div className="flex flex-col p-2 gap-2">
      <div className="opacity-50">tick: {state.tick}</div>
      <div>test</div>
    </div>
  )
}
