import clsx from 'clsx'
import { isEqual } from 'lodash-es'
import {
  PropsWithChildren,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import shortId from 'short-uuid'
import invariant from 'tiny-invariant'
import { Updater, useImmer } from 'use-immer'
import { z } from 'zod'

const TICK_INTERVAL: number = 1000

const ItemLocation = z.enum(['Queue', 'Available'])
type ItemLocation = z.infer<typeof ItemLocation>

const ItemType = z.enum(['Stone', 'Wood'])
type ItemType = z.infer<typeof ItemType>

const Condition = z.strictObject({
  left: ItemType,
  right: z.number(),
  operator: z.union([
    z.literal('lt'),
    z.literal('lte'),
    z.literal('gt'),
    z.literal('gte'),
    z.literal('eq'),
  ]),
})
type Condition = z.infer<typeof Condition>

const PartialCondition = Condition.partial()
type PartialCondition = z.infer<typeof PartialCondition>

const Item = z.strictObject({
  id: z.string(),
  location: ItemLocation,
  type: ItemType,
  condition: Condition.nullable(),
})
type Item = z.infer<typeof Item>

interface State {
  tick: number
  drag: string | null
  items: Item[]
  inventory: Partial<Record<ItemType, number>>
  modal: ModalState
}

enum ModalStateType {
  Initial = 'initial',
  Edit = 'edit',
}

interface BaseModalState {
  open: boolean
}

interface InitialModalState extends BaseModalState {
  type: ModalStateType.Initial
}

interface EditModalState extends BaseModalState {
  type: ModalStateType.Edit
  itemId: string
}

type ModalState = InitialModalState | EditModalState

export function App() {
  const [state, setState] = useImmer<State>({
    tick: 0,
    items: [
      {
        id: shortId.generate(),
        location: ItemLocation.enum.Available,
        type: ItemType.enum.Stone,
        condition: null,
      },
      {
        id: shortId.generate(),
        location: ItemLocation.enum.Available,
        type: ItemType.enum.Wood,
        condition: null,
      },
    ],
    drag: null,
    inventory: {},
    modal: { type: ModalStateType.Initial, open: false },
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
      <Modal
        open={state.modal.open}
        onClose={() => {
          setState((draft) => {
            draft.modal.open = false
          })
        }}
      >
        {state.modal.type === ModalStateType.Edit && (
          <EditoModalContent state={state} />
        )}
      </Modal>
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
      <button
        onClick={() =>
          setState((draft) => {
            draft.modal = {
              type: ModalStateType.Edit,
              open: true,
              itemId: item.id,
            }
          })
        }
      >
        edit
      </button>
    </div>
  )
}

type ModalProps = PropsWithChildren<{
  open: boolean
  onClose: () => void
}>
function Modal({ open, onClose, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (open) {
      ref.current?.showModal()
    } else {
      ref.current?.close()
    }
  }, [open])
  return (
    <dialog
      ref={ref}
      className="backdrop:bg-slate-400 backdrop:bg-opacity-30"
    >
      <form
        method="dialog"
        className="bg-gray-200 p-4 flex flex-col gap-2"
      >
        {children}
        <button onClick={onClose}>Close</button>
      </form>
    </dialog>
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

interface EditoModalContentProps {
  state: State
}

function EditoModalContent({
  state,
}: EditoModalContentProps) {
  const { modal } = state
  invariant(modal.type === ModalStateType.Edit)

  const item = state.items.find(
    ({ id }) => id === modal.itemId,
  )
  invariant(item)

  const [condition, setCondition] =
    useImmer<PartialCondition>(item.condition ?? {})

  const valid = useMemo(
    () => Condition.safeParse(condition).success,
    [condition],
  )

  const dirty = useMemo(
    () => isEqual(condition, item.condition),
    [condition, item.condition],
  )

  return (
    <div>
      <div>{modal.itemId}</div>
      <div>Condition</div>
      <div>
        <div>
          <select
            value={condition.left ?? ''}
            onChange={(e) => {
              setCondition((draft) => {
                draft.left = ItemType.parse(e.target.value)
              })
            }}
          >
            <option value="" disabled>
              Choose Item
            </option>
            {Object.values(ItemType.enum).map(
              (itemType) => (
                <option key={itemType} value={itemType}>
                  {itemType}
                </option>
              ),
            )}
          </select>
        </div>
      </div>
      <button
        className="disabled:opacity-50"
        disabled={!valid || !dirty}
      >
        Save
      </button>
    </div>
  )
}
