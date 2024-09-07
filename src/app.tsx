import clsx from 'clsx'
import {
  Fragment,
  useCallback,
  useEffect,
  useState,
} from 'react'
import { Updater, useImmer } from 'use-immer'

const TICK_INTERVAL: number = 1000

interface State {
  tick: number
  queue: string[]
  available: string[]
  drag: boolean
}

export function App() {
  const [state, setState] = useImmer<State>({
    tick: 0,
    queue: [],
    available: ['stone'],
    drag: false,
  })
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
          <div
            className={clsx(
              'min-h-96',
              state.drag &&
                'border-dashed border border-gray-400',
            )}
          ></div>
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <h2>Available</h2>
          <div>
            {state.available.map((item, i) => (
              <Fragment key={i}>
                <Card item={item} setState={setState} />
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface CardProps {
  item: string
  setState: Updater<State>
}

function Card({ item, setState }: CardProps) {
  const [drag, setDrag] = useState(false)
  useEffect(() => {
    setState((draft) => {
      draft.drag = drag
    })
  }, [drag])

  const onPointerDown = useCallback(() => {
    const controller = new AbortController()
    const { signal } = controller

    setDrag(true)
    document.addEventListener(
      'pointermove',
      (ev) => {
        console.log(ev)
      },
      { signal },
    )

    document.addEventListener(
      'pointerup',
      () => {
        setDrag(false)
        controller.abort()
      },
      { signal },
    )
  }, [setState])

  return (
    <div
      className="border p-4 cursor-pointer hover:opacity-75"
      onPointerDown={onPointerDown}
    >
      {item}
    </div>
  )
}
