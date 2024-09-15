import { isEqual } from 'lodash-es'
import { useCallback, useContext, useMemo } from 'react'
import invariant from 'tiny-invariant'
import { useImmer } from 'use-immer'
import { AppContext } from './context'
import { getVariableLabel } from './get-variable-label'
import {
  Action,
  Context,
  ModalStateType,
  Operator,
  PartialAction,
  PartialCondition,
} from './types'

function newCondition(): PartialCondition {
  return { inputs: [null, null], operator: null }
}

export function ActionModalContent() {
  const { context, setContext } = useContext(AppContext)
  const { modal } = context
  invariant(modal?.type === ModalStateType.Action)

  const action = useMemo(() => {
    const action = context.actions[modal.actionId]
    invariant(action)
    return action
  }, [context.actions, modal.actionId])

  const [state, setState] = useImmer<PartialAction>(action)

  const valid = useMemo(
    () => Action.safeParse(state).success,
    [state],
  )

  const dirty = useMemo(
    () => valid && !isEqual(state, action),
    [valid, state, action.condition],
  )

  const onChangeLeft = useCallback(
    (value: string) => {
      setState((draft) => {
        if (draft.condition === null) {
          draft.condition = newCondition()
        }
        draft.condition.inputs[0] = value
        return draft
      })
    },
    [setState],
  )

  const onChangeRight = useCallback(
    (value: string) => {
      setState((draft) => {
        if (draft.condition === null) {
          draft.condition = newCondition()
        }
        draft.condition.inputs[1] = value
        return draft
      })
    },
    [setState],
  )

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm">Action ID: {action.id}</div>
      <div className="flex justify-between items-center">
        <h2 className="font-bold">Condition</h2>
        <button
          onClick={(ev) => {
            ev.preventDefault()
            setState((draft) => {
              draft.condition = null
            })
          }}
          className="text-blue-700"
        >
          Clear
        </button>
      </div>
      <div className="flex gap-2">
        <label className="flex-1 flex flex-col">
          Left
          <ConditionInput
            value={state.condition?.inputs[0] ?? null}
            onChange={onChangeLeft}
            context={context}
          />
        </label>
        <label className="flex-1 flex flex-col">
          Operator
          <select
            className="border border-black p-2"
            value={state.condition?.operator ?? ''}
            onChange={(e) => {
              setState((draft) => {
                if (draft.condition === null) {
                  draft.condition = newCondition()
                }
                draft.condition.operator = Operator.parse(
                  e.target.value,
                )
                return draft
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
        </label>
        <label className="flex-1 flex flex-col">
          Right
          <ConditionInput
            value={state.condition?.inputs[1] ?? null}
            onChange={onChangeRight}
            context={context}
          />
        </label>
      </div>
      <div>
        <h2 className="font-bold">Output</h2>
      </div>
      <button
        className="border border-black p-2 disabled:opacity-50 hover:opacity-75 active:opacity-50"
        disabled={!valid || !dirty}
        onClick={() => {
          setContext((draft) => {
            draft.actions[modal.actionId] =
              Action.parse(state)
          })
        }}
      >
        Save
      </button>
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
    <select
      className="border border-black p-2"
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
  )
}
