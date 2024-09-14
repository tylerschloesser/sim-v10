import { isEqual } from 'lodash-es'
import { useCallback, useContext, useMemo } from 'react'
import invariant from 'tiny-invariant'
import { useImmer } from 'use-immer'
import { AppContext } from './context'
import { getVariableLabel } from './get-variable-label'
import {
  Condition,
  Context,
  ModalStateType,
  Operator,
  PartialCondition,
} from './types'

function newCondition(): PartialCondition {
  return { inputs: [null, null], operator: null }
}

export function EditModalContent() {
  const { context, setContext } = useContext(AppContext)
  const { modal } = context
  invariant(modal?.type === ModalStateType.Edit)

  const action = useMemo(() => {
    const action = context.actions[modal.actionId]
    invariant(action)
    return action
  }, [context.actions, modal.actionId])

  const [state, setState] = useImmer<PartialCondition>(
    action.condition ?? newCondition,
  )

  const valid = useMemo(
    () => Condition.safeParse(state).success,
    [state],
  )

  const dirty = useMemo(
    () => !isEqual(state, action.condition),
    [state, action.condition],
  )

  const onChangeLeft = useCallback(
    (value: string) => {
      setState((draft) => {
        draft.inputs[0] = value
      })
    },
    [setState],
  )

  const onChangeRight = useCallback(
    (value: string) => {
      setState((draft) => {
        draft.inputs[1] = value
      })
    },
    [setState],
  )

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm">Action ID: {action.id}</div>
      <div className="font-bold">Condition</div>
      <div className="flex gap-2">
        <div className="flex-1">
          <h2>Left</h2>
          <ConditionInput
            value={state.inputs[0]}
            onChange={onChangeLeft}
            context={context}
          />
        </div>
        <div className="flex-1">
          <h2>Operator</h2>
          <select
            className="border"
            value={state.operator ?? ''}
            onChange={(e) => {
              setState((draft) => {
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
          <ConditionInput
            value={state.inputs[1]}
            onChange={onChangeRight}
            context={context}
          />
        </div>
      </div>
      <button
        className="border border-black p-2 disabled:opacity-50 hover:opacity-75 active:opacity-50"
        disabled={!valid || !dirty}
        onClick={() => {
          setContext((draft) => {
            const action = draft.actions[modal.actionId]
            invariant(action)
            action.condition = Condition.parse(state)
          })
        }}
      >
        Save
      </button>
      <h2>Debug</h2>
      <pre className="text-xs max-h-20 overflow-scroll border border-black opacity-50">
        {JSON.stringify(state, null, 2)}
      </pre>
    </div>
  )
}

interface ConditionInputProps {
  value: string | null
  onChange: (value: string) => void
  context: Context
}

function ConditionInput({
  value,
  onChange,
  context,
}: ConditionInputProps) {
  const options = useMemo(() => {
    return Object.values(context.variables).map(
      (variable) => ({
        value: variable.id,
        label: getVariableLabel(variable),
      }),
    )
  }, [context.variables])
  return (
    <div>
      <select
        value={value ?? ''}
        onChange={(e) => {
          onChange(e.target.value)
        }}
      >
        <option value="" disabled>
          Choose Variable
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
