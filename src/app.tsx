import clsx from 'clsx'
import { useCallback, useEffect, useRef } from 'react'
import shortId from 'short-uuid'
import invariant from 'tiny-invariant'
import { Updater, useImmer } from 'use-immer'
import { z } from 'zod'

const TICK_INTERVAL: number = 1000

const ItemLocation = z.enum(['Queue', 'Available'])
type ItemLocation = z.infer<typeof ItemLocation>

const ItemType = z.enum(['Stone', 'Wood'])
type ItemType = z.infer<typeof ItemType>

const Item = z.strictObject({
  id: z.string(),
  location: ItemLocation,
  type: ItemType,
})
type Item = z.infer<typeof Item>

interface State {
  tick: number
  drag: string | null
  items: Item[]
  inventory: Partial<Record<ItemType, number>>
}

export function App() {
  const [state, setState] = useImmer<State>({
    tick: 0,
    items: [
      {
        id: shortId.generate(),
        location: ItemLocation.enum.Available,
        type: ItemType.enum.Stone,
      },
      {
        id: shortId.generate(),
        location: ItemLocation.enum.Available,
        type: ItemType.enum.Wood,
      },
    ],
    drag: null,
    inventory: {},
  })
  useEffect(() => {
    const interval = setInterval(() => {
      setState((draft) => {
        draft.tick += 1
        for (const item of draft.items.filter(
          ({ location }) =>
            location === ItemLocation.enum.Queue,
        )) {
          draft.inventory[item.type] =
            (draft.inventory[item.type] ?? 0) + 1
        }
      })
    }, TICK_INTERVAL)
    return () => {
      clearInterval(interval)
    }
  }, [])
  return (
    <>
      <div className="flex flex-col p-2 gap-2">
        <div>Tick: {state.tick.toString()}</div>
        <div>
          Inventory:
          {Object.entries(state.inventory)
            .map(([type, count]) => `${type}: (${count})`)
            .join(', ')}
        </div>
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
      <div className="fixed bottom-0 left-0 p-2 font-mono whitespace-pre opacity-25 pointer-events-none text-sm">
        {JSON.stringify(state, null, 2)}
      </div>
    </>
  )
}

interface CardProps {
  item: Item
  setState: Updater<State>
}

function Card({ item, setState }: CardProps) {
  return (
    <div
      role="button"
      draggable
      onDragStart={(ev) => {
        ev.dataTransfer.setData('text/plain', item.id)
        setState((draft) => {
          draft.drag = item.id
        })
      }}
      onDragEnd={() => {
        setState((draft) => {
          draft.drag = null
        })
      }}
      onDrop={(ev) => {
        ev.preventDefault()
      }}
      className={clsx(
        'flex justify-between items-center',
        'border p-4 cursor-pointer hover:opacity-75',
      )}
    >
      <span>{item.type}</span>
      <div>
        <Modal>
          {({ dialog, open }) => (
            <>
              {dialog}
              <button onClick={open}>edit</button>
            </>
          )}
        </Modal>
      </div>
    </div>
  )
}

interface ModalProps {
  children: (props: {
    dialog: React.ReactNode
    open: () => void
  }) => React.ReactNode
}
function Modal({ children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const open = useCallback(() => {
    ref.current?.showModal()
  }, [])
  const dialog = (
    <dialog ref={ref}>
      Hello!
      <button
        onClick={() => {
          ref.current?.close()
        }}
      >
        Close
      </button>
    </dialog>
  )
  return children({ dialog, open })
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
          draft.drag = null
          const item = draft.items.find(
            ({ id }) => id === itemId,
          )
          invariant(item)
          item.location = location
        })
      }}
      onDragOver={(ev) => {
        ev.preventDefault()
      }}
      className={clsx(
        'min-h-96 border border-dashed flex flex-col gap-2',
        state.drag
          ? 'border-gray-400'
          : 'border-transparent',
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
