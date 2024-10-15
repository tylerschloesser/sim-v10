import { useEffect } from 'react'
import { Updater, useImmer } from 'use-immer'
import { z } from 'zod'

const TICK_RATE = 100

const State = z.strictObject({
  tick: z.number().nonnegative(),
})
type State = z.infer<typeof State>

function tick(setState: Updater<State>) {
  setState((draft) => {
    draft.tick += 1
  })
}

export function App() {
  const [state, setState] = useImmer<State>({ tick: 0 })
  useEffect(() => {
    const interval = self.setInterval(
      () => tick(setState),
      TICK_RATE,
    )
    return () => {
      self.clearInterval(interval)
    }
  }, [setState])

  return <>tick: {state.tick}</>
}
