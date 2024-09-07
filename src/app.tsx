import { useEffect } from 'react'
import { useImmer } from 'use-immer'

const TICK_INTERVAL: number = 1000

interface State {
  tick: number
}

export function App() {
  const [state, setState] = useImmer<State>({ tick: 0 })
  useEffect(() => {
    const interval = setInterval(() => {
      setState((draft) => {
        draft.tick += 1
      })
    }, TICK_INTERVAL)
    return () => {
      clearInterval(interval)
    }
  }, [])
  return (
    <div>
      <div>Tick: {state.tick.toString()}</div>
    </div>
  )
}
