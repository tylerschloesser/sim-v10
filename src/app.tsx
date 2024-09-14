import clsx from 'clsx'
import React, {
  Fragment,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import shortId from 'short-uuid'
import invariant from 'tiny-invariant'
import { Updater, useImmer } from 'use-immer'
import { EditModalContent } from './edit-modal'
import {
  CustomVariableFunctionType,
  FunctionInputType,
  Item,
  ItemLocation,
  ItemType,
  ModalStateType,
  Context,
  Variable,
  VariableType,
} from './types'
import { useTickInterval } from './use-tick-interval'
import { VariableModalContent } from './variable-modal'

const INITIAL_VARIABLES: Context['variables'] = {}

function addItemVariable(item: ItemType): void {
  const id = shortId.generate()
  INITIAL_VARIABLES[id] = {
    id,
    type: VariableType.enum.Item,
    item,
  }
}

addItemVariable(ItemType.enum.Stone)
addItemVariable(ItemType.enum.Wood)

const INITIAL_CONTEXT: Context = {
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
  variables: INITIAL_VARIABLES,
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

export interface VariableValueProps {
  variable: Variable
  context: Context
}

function getVariableValue(
  variable: Variable,
  context: Context,
) {
  switch (variable.type) {
    case VariableType.enum.Item:
      return context.inventory[variable.item] ?? 0
    case VariableType.enum.Custom: {
      switch (variable.fn.type) {
        case CustomVariableFunctionType.enum.Identity: {
          switch (variable.fn.input.type) {
            case FunctionInputType.enum.Constant:
              return variable.fn.input.value
            case FunctionInputType.enum.Variable: {
              const input =
                context.variables[variable.fn.input.id]
              invariant(input)
              return getVariableValue(input, context)
            }
          }
        }
        default:
          invariant(false)
      }
    }
  }
}

function VariableValue({
  variable,
  context,
}: VariableValueProps) {
  const value = useMemo(
    () => getVariableValue(variable, context),
    [variable, context],
  )
  return <>{JSON.stringify(value)}</>
}

const AppContext = React.createContext<{
  context: Context
  setContext: Updater<Context>
}>(null!)

export function App() {
  const [context, setContext] =
    useImmer<Context>(INITIAL_CONTEXT)
  useTickInterval(setContext)

  return (
    <AppContext.Provider
      value={useMemo(
        () => ({ context, setContext }),
        [context, setContext],
      )}
    >
      <div className="flex flex-col p-2 gap-2">
        <div>Tick: {context.tick.toString()}</div>
        <AppVariables />
        <div className="flex gap-2">
          <div className="flex-1 flex flex-col gap-2">
            <h2>Queue</h2>
            <ItemList
              location={ItemLocation.enum.Queue}
              context={context}
              setContext={setContext}
            />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <h2>Available</h2>
            <ItemList
              location={ItemLocation.enum.Available}
              context={context}
              setContext={setContext}
            />
          </div>
        </div>
      </div>
      <AppDebug />
      <AppModal />
    </AppContext.Provider>
  )
}

interface CardProps {
  item: Item
  setContext: Updater<Context>
}

function Card({ item, setContext }: CardProps) {
  return (
    <div
      role="button"
      draggable
      onDragStart={(ev) => {
        ev.dataTransfer.setData('text/plain', item.id)
        setContext((draft) => {
          draft.drag = item.id
        })
      }}
      onDragEnd={() => {
        setContext((draft) => {
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
            setContext((draft) => {
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
  context: Context
  setContext: Updater<Context>
}

function ItemList({
  location,
  context,
  setContext,
}: ItemListProps) {
  return (
    <div
      onDrop={(ev) => {
        ev.preventDefault()
        const itemId = ev.dataTransfer.getData('text/plain')
        setContext((draft) => {
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
        context.drag
          ? 'border-gray-400'
          : 'border-transparent',
      )}
    >
      {context.items
        .filter((item) => item.location === location)
        .map((item) => (
          <Card
            key={item.id}
            item={item}
            setContext={setContext}
          />
        ))}
    </div>
  )
}

function AppVariables() {
  const { context, setContext } = useContext(AppContext)
  return (
    <>
      <div>Variables</div>
      <div className="grid grid-cols-[repeat(4,min-content)] gap-4">
        {Object.values(context.variables).map(
          (variable) => (
            <Fragment key={variable.id}>
              <div>{variable.type}</div>
              <div>
                {variable.type === VariableType.enum.Item
                  ? variable.item
                  : variable.id}
              </div>
              <div>
                <VariableValue
                  variable={variable}
                  context={context}
                />
              </div>
              {variable.type ===
              VariableType.enum.Custom ? (
                <a
                  href="#"
                  className="text-blue-300"
                  onClick={(e) => {
                    e.preventDefault()
                    setContext((draft) => {
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
              ) : (
                <span />
              )}
            </Fragment>
          ),
        )}
      </div>
      <div>
        <button
          className="border p-2 hover:opacity-75 active:opacity-50"
          onClick={() => {
            setContext((draft) => {
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
    </>
  )
}

function AppDebug() {
  const { context } = useContext(AppContext)
  const scrollDebug = useScrollDebug()
  return (
    <div
      className={clsx(
        'fixed top-0 bottom-0 left-0 p-2 font-mono whitespace-pre opacity-25 text-sm overflow-scroll',
        !scrollDebug && 'pointer-events-none',
      )}
    >
      {JSON.stringify(context, null, 2)}
    </div>
  )
}

function AppModal() {
  const { context, setContext } = useContext(AppContext)
  const onCloseModal = useCallback(() => {
    setContext((draft) => {
      draft.modal.open = false
    })
  }, [setContext])
  return (
    <Modal
      title={(() => {
        switch (context.modal.type) {
          case ModalStateType.Edit:
            return 'Edit'
          case ModalStateType.Variable:
            return context.modal.variable
              ? 'Edit Variable'
              : 'New Variable'
          default:
            return '[Missing Title]'
        }
      })()}
      open={context.modal.open}
      onClose={onCloseModal}
    >
      <>
        {context.modal.type === ModalStateType.Edit && (
          <EditModalContent
            context={context}
            setContext={setContext}
            onClose={onCloseModal}
          />
        )}
        {context.modal.type === ModalStateType.Variable && (
          <VariableModalContent
            context={context}
            onSave={(variable) => {
              setContext((draft) => {
                draft.variables[variable.id] = variable
              })
            }}
            variable={context.modal.variable}
          />
        )}
      </>
    </Modal>
  )
}
