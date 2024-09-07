import clsx from 'clsx'
import { useEffect, useState } from 'react'
import shortId from 'short-uuid'
import invariant from 'tiny-invariant'
import { Updater, useImmer } from 'use-immer'
import { z } from 'zod'

const TICK_INTERVAL: number = 1000

const ItemLocation = z.enum(['Queue', 'Available'])
type ItemLocation = z.infer<typeof ItemLocation>

const Item = z.strictObject({
  id: z.string(),
  name: z.string(),
  location: ItemLocation,
})
type Item = z.infer<typeof Item>

interface State {
  tick: number
  drag: string | null
  items: Item[]
}

export function App() {
  const [state, setState] = useImmer<State>({
    tick: 0,
    items: [
      {
        id: shortId.generate(),
        name: 'stone',
        location: ItemLocation.enum.Available,
      },
    ],
    drag: null,
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
        <div className="flex-1 flex flex-col gap-2">
          <h2>Queue</h2>
          <ItemList
            location={ItemLocation.enum.Queue}
            state={state}
            setState={setState}
          />
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <h2>Available</h2>
          <ItemList
            location={ItemLocation.enum.Available}
            state={state}
            setState={setState}
          />
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
      draft.drag = drag ? item.id : null
    })
  }, [drag, item.id])
  return (
    <div
      role="button"
      draggable
      onDragStart={(ev) => {
        ev.dataTransfer.setData('text/plain', item.id)
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

interface ItemListProps {
  location: ItemLocation
  state: State
  setState: Updater<State>
}

function ItemList({
  location,
  state,
  setState,
}: ItemListProps) {
  return (
    <div
      onDrop={(ev) => {
        ev.preventDefault()
        const itemId = ev.dataTransfer.getData('text/plain')
        setState((draft) => {
          const item = draft.items.find(
            ({ id }) => id === itemId,
          )
          invariant(item)
          item.location = location
        })
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
    >
      {state.items
        .filter((item) => item.location === location)
        .map((item) => (
          <Card
            key={item.id}
            item={item}
            setState={setState}
          />
        ))}
    </div>
  )
}
