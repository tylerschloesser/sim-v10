import clsx from 'clsx'
import { isEqual } from 'lodash-es'
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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
  PartialValue,
  State,
  ValueType,
} from './types'
import { useTickInterval } from './use-tick-interval'

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

function useScrollDebug() {
  const [scrollDebug, setScrollDebug] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    // prettier-ignore
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'd') {
        ev.preventDefault()
        setScrollDebug(true)
      }
    }, { signal, })

    // prettier-ignore
    document.addEventListener('keyup', (ev) => {
      if (ev.key === 'd') {
        ev.preventDefault()
        setScrollDebug(false)
      }
    }, { signal, })
  }, [])

  return scrollDebug
}

export function App() {
  const [state, setState] = useImmer<State>(INITIAL_STATE)
  useTickInterval(setState)
  const scrollDebug = useScrollDebug()
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
      <div
        className={clsx(
          'fixed top-0 bottom-0 left-0 p-2 font-mono whitespace-pre opacity-25 text-sm overflow-scroll',
          !scrollDebug && 'pointer-events-none',
        )}
      >
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
          <EditModalContent
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
      className="relative border p-4 cursor-pointer hover:opacity-75"
    >
      {item.type === ItemType.enum.ResearchStone && (
        <div
          className="absolute top-0 left-0 h-full bg-green-400 w-full origin-top-left transition-transform"
          style={{
            transform: `scaleX(${Math.min(item.progress / 100, 1)})`,
          }}
        ></div>
      )}
      <div className="relative flex justify-between items-center">
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

  useEffect(() => {
    invariant(ref.current)
    ref.current.addEventListener('close', onClose)
  }, [])
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
        <button
          onClick={() => {
            ref.current?.close()
          }}
        >
          Close
        </button>
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

interface ConditionValueInputProps {
  value: PartialValue | null
  onChange: (value: PartialValue) => void
}
function ConditionValueInput({
  value,
  onChange,
}: ConditionValueInputProps) {
  return (
    <div>
      <fieldset className="flex flex-col">
        <legend>Type</legend>
        <label className="flex gap-1">
          <input
            type="radio"
            value={ValueType.enum.Constant}
            checked={
              value?.type === ValueType.enum.Constant
            }
            onChange={() =>
              onChange({
                type: ValueType.enum.Constant,
                constant: null,
              })
            }
          />
          Constant
        </label>
        <label className="flex gap-1">
          <input
            type="radio"
            value={ValueType.enum.Variable}
            checked={
              value?.type === ValueType.enum.Variable
            }
            onChange={() =>
              onChange({
                type: ValueType.enum.Variable,
                variable: null,
              })
            }
          />
          Variable
        </label>
      </fieldset>
      {value?.type === ValueType.enum.Constant && (
        <input
          type="number"
          value={value.constant ?? ''}
          onChange={(e) =>
            onChange({
              type: ValueType.enum.Constant,
              constant: parseInt(e.target.value),
            })
          }
        />
      )}
      {value?.type === ValueType.enum.Variable && (
        <select
          value={value.variable ?? ''}
          onChange={(e) =>
            onChange({
              type: ValueType.enum.Variable,
              variable: e.target.value,
            })
          }
        >
          <option value="" disabled></option>
          {Object.values(ItemType.Values).map(
            (itemType) => (
              <option key={itemType} value={itemType}>
                {itemType}
              </option>
            ),
          )}
        </select>
      )}

      {value === null && (
        <input type="text" value="" disabled />
      )}
    </div>
  )
}

function EditModalContent({
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
    useImmer<PartialCondition>(
      item.condition ?? {
        left: null,
        right: null,
        operator: null,
      },
    )

  const valid = useMemo(
    () => Condition.safeParse(condition).success,
    [condition],
  )

  const dirty = useMemo(
    () => !isEqual(condition, item.condition),
    [condition, item.condition],
  )

  const onChangeLeft = useCallback(
    (value: PartialValue) => {
      setCondition((draft) => {
        draft.left = value
      })
    },
    [setCondition],
  )

  const onChangeRight = useCallback(
    (value: PartialValue) => {
      setCondition((draft) => {
        draft.right = value
      })
    },
    [setCondition],
  )

  return (
    <div>
      <div>{modal.itemId}</div>
      <div>Condition</div>
      <div className="flex gap-2">
        <div className="flex-1">
          <h2>Left</h2>
          <ConditionValueInput
            value={condition.left ?? null}
            onChange={onChangeLeft}
          />
        </div>
        <div className="flex-1">
          <h2>Operator</h2>
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
            <option value="" disabled></option>
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
          <h2>Right</h2>
          <ConditionValueInput
            value={condition.right ?? null}
            onChange={onChangeRight}
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
      <h2>Debug</h2>
      <pre className="text-xs max-h-20 overflow-scroll border border-black opacity-50">
        {JSON.stringify(condition, null, 2)}
      </pre>
    </div>
  )
}
