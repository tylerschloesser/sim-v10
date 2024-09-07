import clsx from 'clsx'
import { Fragment, useEffect, useState } from 'react'
import shortId from 'short-uuid'
import { Updater, useImmer } from 'use-immer'

const TICK_INTERVAL: number = 1000

interface Item {
  id: string
  name: string
}

interface State {
  tick: number
  queue: Item[]
  available: Item[]
  drag: boolean
}

export function App() {
  const [state, setState] = useImmer<State>({
    tick: 0,
    queue: [],
    available: [{ id: shortId.generate(), name: 'stone' }],
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
          <Queue state={state} />
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <h2>Available</h2>
          <div>
            {state.available.map((item) => (
              <Fragment key={item.id}>
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
  item: Item
  setState: Updater<State>
}

function Card({ item, setState }: CardProps) {
  const [drag, setDrag] = useState(false)
  useEffect(() => {
    setState((draft) => {
      draft.drag = drag
    })
  }, [drag])

  return (
    <div
      draggable
      onDragStart={(ev) => {
        ev.dataTransfer.setData(
          'text/plain',
          JSON.stringify(item),
        )
        setDrag(true)
      }}
      onDragEnd={(ev) => {
        setDrag(false)
      }}
      onDrop={(ev) => {
        console.log(ev)
      }}
      className={clsx(
        'border p-4 cursor-pointer',
        drag ? 'opacity-50' : 'hover:opacity-75',
      )}
    >
      {item.name}
    </div>
  )
}

interface QueueProps {
  state: State
}

function Queue({ state }: QueueProps) {
  return (
    <div
      onDrop={(ev) => {
        ev.preventDefault()
        console.log(ev)
      }}
      onDragOver={(ev) => {
        ev.preventDefault()
        console.log(ev)
      }}
      className={clsx(
        'min-h-96',
        state.drag &&
          'border-dashed border border-gray-400',
      )}
    ></div>
  )
}
