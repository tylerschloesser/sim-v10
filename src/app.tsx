import { useEffect } from 'react'
import { Updater, useImmer } from 'use-immer'
import { z } from 'zod'

const TICK_RATE = 100

const ItemType = z.enum(['Coal', 'Stone'])
type ItemType = z.infer<typeof ItemType>

const Inventory = z.record(ItemType, z.number())
type Inventory = z.infer<typeof Inventory>

const State = z.strictObject({
  tick: z.number().nonnegative(),
  inventory: Inventory,
})
type State = z.infer<typeof State>

function tick(setState: Updater<State>) {
  setState((draft) => {
    draft.tick += 1
  })
}

export function App() {
  const [state, setState] = useImmer<State>({
    tick: 0,
    inventory: {},
  })
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
