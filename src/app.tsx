import clsx from 'clsx'
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import invariant from 'tiny-invariant'
import { useImmer } from 'use-immer'
import { ActionModalContent } from './action-modal'
import { AppDebug } from './app-debug'
import { AppContext, INITIAL_CONTEXT } from './context'
import { getVariableLabel } from './get-variable-label'
import { getVariableValue } from './get-variable-value'
import { Modal } from './modal'
import {
  Condition,
  Context,
  ModalStateType,
  Variable,
  VariableType,
} from './types'
import { useTickInterval } from './use-tick-interval'
import { VariableModalContent } from './variable-modal'
import { Rect, Vec2 } from './vec2'

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
        <AppCanvas />
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
                    type: ModalStateType.Action,
                    actionId: action.id,
                  }
                })
              }}
            >
              Edit
            </button>
          </div>
          <div className="flex flex-col gap-2 p-4 pt-0">
            <div>
              Condition:{' '}
              {action.condition
                ? formatCondition(action.condition, context)
                : '[None]'}
            </div>
            <div>
              Output: {action.output ?? <>[None]</>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function AppVariables() {
  const { context, setContext } = useContext(AppContext)
  return (
    <>
      <div>Variables</div>
      <table className="text-left border border-white border-separate border-spacing-2">
        <thead>
          <tr>
            <th>Type</th>
            <th>Name/ID</th>
            <th>Value</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {Object.values(context.variables).map(
            (variable) => (
              <tr key={variable.id}>
                <td>{variable.type}</td>
                <td>{getVariableLabel(variable)}</td>
                <td>
                  {getVariableValue(variable, context)}
                </td>
                <td>
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
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
      <div className="flex flex-row-reverse">
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
          case ModalStateType.Action:
            return 'Edit Action'
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
        {context.modal.type === ModalStateType.Action && (
          <ActionModalContent />
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

function formatOperator(operator: string): string {
  switch (operator) {
    case 'lt':
      return '<'
    case 'lte':
      return '<='
    case 'gt':
      return '>'
    case 'gte':
      return '>='
    case 'eq':
      return '=='
    default:
      invariant(false)
  }
}

function getVariable(
  id: string,
  context: Context,
): Variable {
  const variable = context.variables[id]
  invariant(variable)
  return variable
}

function formatCondition(
  condition: Condition,
  context: Context,
): string {
  return [
    getVariableLabel(
      getVariable(condition.inputs[0], context),
    ),
    formatOperator(condition.operator),
    getVariableLabel(
      getVariable(condition.inputs[1], context),
    ),
  ].join(' ')
}

function AppCanvas() {
  const ref = useRef<HTMLDivElement>(null)

  const [state, setState] = useImmer<{
    rect: Rect | null
    pointer: Vec2 | null
    entities: Rect[]
  }>({
    rect: null,
    pointer: null,
    entities: [
      new Rect(new Vec2(50, 50), new Vec2(50, 50)),
      new Rect(new Vec2(100, 100), new Vec2(50, 50)),
    ],
  })

  useEffect(() => {
    invariant(ref.current)
    const rect = ref.current.getBoundingClientRect()
    setState((draft) => {
      draft.rect = new Rect(
        new Vec2(rect.x, rect.y),
        new Vec2(rect.width, rect.height),
      )
    })
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    // prettier-ignore
    document.addEventListener('pointermove', (e) => {
      setState(draft => {
        draft.pointer = new Vec2(e.clientX, e.clientY)
      })
    }, { signal })

    // prettier-ignore
    document.addEventListener('pointerleave', () => {
      setState(draft => {
        draft.pointer = null
      })
    }, { signal })

    // prettier-ignore
    document.addEventListener('scroll', () => {
      invariant(ref.current)
      const rect = ref.current.getBoundingClientRect()
      setState(draft => {
        draft.rect = new Rect(
          new Vec2(rect.x, rect.y),
          new Vec2(rect.width, rect.height),
        )
      }) 
    }, { signal })

    return () => controller.abort()
  }, [])

  const rect = useMemo(() => state.rect, [state.rect])
  const pointer = useMemo(
    () => state.pointer,
    [state.pointer],
  )

  const translate = useMemo(() => {
    if (!rect || !pointer) {
      return Vec2.ZERO
    }
    return rect.position.mul(-1).add(pointer)
  }, [rect, pointer])

  const active = useMemo(() => {
    if (!rect || !pointer) {
      return false
    }
    return rect.contains(pointer)
  }, [rect, pointer])

  return (
    <div ref={ref} className="border border-white h-dvh">
      {state && (
        <>
          {pointer && (
            <div
              className={clsx(
                'absolute pointer-events-none border border-green-400',
                !active && 'opacity-50',
              )}
              style={{
                transform: `translate(${translate.x}px, ${translate.y}px)`,
              }}
            >
              TODO
            </div>
          )}
          {state.entities.map((entity, index) => (
            <div
              key={index}
              className="absolute bg-red-400"
              style={{
                transform: `translate(${entity.position.x}px, ${entity.position.y}px)`,
                width: entity.size.x,
                height: entity.size.y,
              }}
            />
          ))}
        </>
      )}
    </div>
  )
}
