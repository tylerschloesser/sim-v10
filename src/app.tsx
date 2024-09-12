import clsx from 'clsx'
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import shortId from 'short-uuid'
import invariant from 'tiny-invariant'
import { Updater, useImmer } from 'use-immer'
import { EditModalContent } from './edit-modal'
import {
  Item,
  ItemLocation,
  ItemType,
  ModalStateType,
  State,
} from './types'
import { useTickInterval } from './use-tick-interval'
import { VariableModalContent } from './variable-modal'

const INITIAL_STATE: State = {
  tick: 0,
  items: [
    {
      id: shortId.generate(),
      location: ItemLocation.enum.Available,
      type: ItemType.enum.Stone,
      condition: null,
      output: null,
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
  variables: {},
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

  const onCloseModal = useCallback(() => {
    setState((draft) => {
      draft.modal.open = false
    })
  }, [])

  return (
    <>
      <div className="flex flex-col p-2 gap-2">
        <div>Tick: {state.tick.toString()}</div>
        <div>
          Inventory:{' '}
          {Object.entries(state.inventory)
            .map(([type, count]) => `${type}: (${count})`)
            .join(', ')}
        </div>
        <div>Variables</div>
        <div>
          {Object.values(state.variables).map(
            (variable) => (
              <div key={variable.id} className="flex gap-2">
                <div>{variable.id}</div>
                <a
                  href="#"
                  className="text-blue-300"
                  onClick={(e) => {
                    e.preventDefault()
                    setState((draft) => {
                      draft.modal = {
                        type: ModalStateType.Variable,
                        open: true,
                        variable,
                      }
                    })
                  }}
                >
                  Edit
                </a>
              </div>
            ),
          )}
        </div>
        <div>
          <button
            className="border p-2 hover:opacity-75 active:opacity-50"
            onClick={() => {
              setState((draft) => {
                draft.modal = {
                  type: ModalStateType.Variable,
                  open: true,
                  variable: null,
                }
              })
            }}
          >
            New Variable
          </button>
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
        title={(() => {
          switch (state.modal.type) {
            case ModalStateType.Edit:
              return 'Edit'
            case ModalStateType.Variable:
              return state.modal.variable
                ? 'Edit Variable'
                : 'New Variable'
            default:
              return '[Missing Title]'
          }
        })()}
        open={state.modal.open}
        onClose={onCloseModal}
      >
        <>
          {state.modal.type === ModalStateType.Edit && (
            <EditModalContent
              state={state}
              setState={setState}
              onClose={onCloseModal}
            />
          )}
          {state.modal.type === ModalStateType.Variable && (
            <VariableModalContent
              onSave={(variable) => {
                setState((draft) => {
                  draft.variables[variable.id] = variable
                })
              }}
              variable={state.modal.variable}
            />
          )}
        </>
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
      className="relative border p-4 cursor-pointer hover:opacity-75 active:opacity-50"
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
  title: string
  open: boolean
  onClose: () => void
}>

function Modal({
  title,
  open,
  onClose,
  children,
}: ModalProps) {
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
        className="bg-gray-200 flex flex-col"
      >
        <div className="border-b border-black p-4 gap-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            className="border border-black p-2 hover:opacity-75 active:opacity-50"
            onClick={() => {
              ref.current?.close()
            }}
          >
            Close
          </button>
        </div>
        <div className="p-4">{children}</div>
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
