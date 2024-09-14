import {
  Fragment,
  useCallback,
  useContext,
  useMemo,
} from 'react'
import invariant from 'tiny-invariant'
import { useImmer } from 'use-immer'
import { ActionModalContent } from './action-modal'
import { AppDebug } from './app-debug'
import { AppContext, INITIAL_CONTEXT } from './context'
import { getVariableLabel } from './get-variable-label'
import { Modal } from './modal'
import { RenderVariableValue } from './render-variable-value'
import {
  Condition,
  Context,
  ModalStateType,
  Variable,
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
