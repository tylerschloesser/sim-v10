import clsx from 'clsx'
import {
  Fragment,
  useCallback,
  useContext,
  useMemo,
} from 'react'
import invariant from 'tiny-invariant'
import { Updater, useImmer } from 'use-immer'
import { AppDebug } from './app-debug'
import { AppContext, INITIAL_CONTEXT } from './context'
import { EditModalContent } from './edit-modal'
import { getVariableLabel } from './get-variable-label'
import { Modal } from './modal'
import { RenderVariableValue } from './render-variable-value'
import {
  Context,
  Item,
  ItemLocation,
  ItemType,
  ModalStateType,
  VariableType,
} from './types'
import { useTickInterval } from './use-tick-interval'
import { VariableModalContent } from './variable-modal'

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
        <AppActions />
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

function AppActions() {
  const { context, setContext } = useContext(AppContext)
  return (
    <div className="flex flex-col gap-2">
      {Object.values(context.actions).map((action) => (
        <div
          key={action.id}
          className="border border-white border-opacity-50"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold px-4">
              {action.type}
            </h2>
            <button
              className="text-blue-300 py-2 px-4"
              onClick={() => {
                setContext((draft) => {
                  draft.modal = {
                    type: ModalStateType.Edit,
                    actionId: action.id,
                  }
                })
              }}
            >
              Edit
            </button>
          </div>
          <div className="flex flex-col gap-2 p-4 pt-0">
            {!action.condition && <>No condition</>}
            {action.condition && (
              <pre>
                {JSON.stringify(action.condition, null, 2)}
              </pre>
            )}
          </div>
        </div>
      ))}
    </div>
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
      <div className="relative flex justify-between items-center">
        <span>
          <span>{item.type}</span>
          {item.condition && <span>[Condition]</span>}
        </span>
        <button>edit</button>
      </div>
    </div>
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
              <div>{getVariableLabel(variable)}</div>
              <div>
                <RenderVariableValue
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

function AppModal() {
  const { context, setContext } = useContext(AppContext)
  const onCloseModal = useCallback(() => {
    setContext((draft) => {
      draft.modal = null
    })
  }, [setContext])
  if (context.modal === null) {
    return null
  }
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
      onClose={onCloseModal}
    >
      <>
        {context.modal.type === ModalStateType.Edit && (
          <EditModalContent />
        )}
        {context.modal.type === ModalStateType.Variable && (
          <VariableModalContent
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
