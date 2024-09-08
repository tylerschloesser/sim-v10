import clsx from 'clsx'
import { WritableDraft } from 'immer'
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
import {
  Condition,
  Item,
  ItemLocation,
  ItemType,
  ModalStateType,
  Operator,
  PartialCondition,
  State,
} from './types'

const TICK_INTERVAL: number = 1000

const INITIAL_STATE: State = {
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
    {
      id: shortId.generate(),
      location: ItemLocation.enum.Available,
      type: ItemType.enum.ResearchStone,
      condition: null,
      progress: 0,
    },
  ],
  drag: null,
  inventory: {},
  modal: { type: ModalStateType.Initial, open: false },
}

export function App() {
  const [state, setState] = useImmer<State>(INITIAL_STATE)
  useEffect(() => {
    const interval = setInterval(() => {
      setState(tickState)
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
          <EditoModalContent
            state={state}
            setState={setState}
          />
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
      <span>
        <span>{item.type}</span>
        {item.condition && <span>[Condition]</span>}
      </span>
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
  setState: Updater<State>
}

function EditoModalContent({
  state,
  setState,
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
    () => !isEqual(condition, item.condition),
    [condition, item.condition],
  )

  return (
    <div>
      <div>{modal.itemId}</div>
      <div>Condition</div>
      <div className="flex gap-2">
        <div className="flex-1">
          <select
            className="border"
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
        <div className="flex-1">
          <select
            className="border"
            value={condition.operator ?? ''}
            onChange={(e) => {
              setCondition((draft) => {
                draft.operator = Operator.parse(
                  e.target.value,
                )
              })
            }}
          >
            <option value="" disabled>
              Choose Operator
            </option>
            {Object.values(Operator.enum).map(
              (operator) => (
                <option key={operator} value={operator}>
                  {operator}
                </option>
              ),
            )}
          </select>
        </div>
        <div className="flex-1">
          <input
            className="border"
            type="number"
            value={condition.right ?? ''}
            onChange={(e) => {
              setCondition((draft) => {
                draft.right = parseInt(e.target.value)
              })
            }}
          />
        </div>
      </div>
      <button
        className="disabled:opacity-50"
        disabled={!valid || !dirty}
        onClick={() => {
          setState((draft) => {
            const item = draft.items.find(
              ({ id }) => id === modal.itemId,
            )
            invariant(item)
            item.condition = Condition.parse(condition)
          })
        }}
      >
        Save
      </button>
    </div>
  )
}

function tickState(draft: WritableDraft<State>) {
  draft.tick += 1
  for (const item of draft.items.filter(
    ({ location }) => location === ItemLocation.enum.Queue,
  )) {
    if (
      item.condition === null ||
      isConditionSatisfied(item.condition, draft.inventory)
    ) {
      draft.inventory[item.type] =
        (draft.inventory[item.type] ?? 0) + 1
    }
  }
}

function isConditionSatisfied(
  condition: Condition,
  inventory: Partial<Record<ItemType, number>>,
): boolean {
  const left = inventory[condition.left] ?? 0
  const right = condition.right
  const operator = condition.operator
  return (
    (operator === Operator.enum.lt && left < right) ||
    (operator === Operator.enum.lte && left <= right) ||
    (operator === Operator.enum.gt && left > right) ||
    (operator === Operator.enum.gte && left >= right) ||
    (operator === Operator.enum.eq && left === right)
  )
}
