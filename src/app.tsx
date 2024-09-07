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
    <div className="flex flex-col p-2 gap-2">
      <div>Tick: {state.tick.toString()}</div>
      <div className="flex gap-2">
        <div className="flex-1">
          <h2>Queue</h2>
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <h2>Available</h2>
          <div>
            <div className="border p-4">Stone</div>
          </div>
        </div>
      </div>
    </div>
  )
}
