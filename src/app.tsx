import { useImmer } from 'use-immer'

interface State {
  tick: number
}

export function App() {
  const [state, setState] = useImmer<State>({ tick: 0 })
  return (
    <div>
      <div>Tick: {state.tick.toString()}</div>
    </div>
  )
}
