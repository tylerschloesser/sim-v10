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

export function ActionModalContent() {
  const { context, setContext } = useContext(AppContext)
  const { modal } = context
  invariant(modal?.type === ModalStateType.Action)

  const action = useMemo(() => {
    const action = context.actions[modal.actionId]
    invariant(action)
    return action
  }, [context.actions, modal.actionId])

  const [state, setState] =
    useImmer<PartialCondition | null>(action.condition)

  const valid = useMemo(
    () => Condition.nullable().safeParse(state).success,
    [state],
  )

  const dirty = useMemo(
    () => valid && !isEqual(state, action.condition),
    [valid, state, action.condition],
  )

  const onChangeLeft = useCallback(
    (value: string) => {
      setState((draft) => {
        if (draft === null) {
          draft = newCondition()
        }
        draft.inputs[0] = value
        return draft
      })
    },
    [setState],
  )

  const onChangeRight = useCallback(
    (value: string) => {
      setState((draft) => {
        if (draft === null) {
          draft = newCondition()
        }
        draft.inputs[1] = value
        return draft
      })
    },
    [setState],
  )

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm">Action ID: {action.id}</div>
      <div className="flex justify-between items-center">
        <span className="font-bold">Condition</span>

        <button
          onClick={(ev) => {
            ev.preventDefault()
            setState(null)
          }}
          className="text-blue-700"
        >
          Clear
        </button>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <h2>Left</h2>
          <ConditionInput
            value={state?.inputs[0] ?? null}
            onChange={onChangeLeft}
            context={context}
          />
        </div>
        <div className="flex-1">
          <h2>Operator</h2>
          <select
            className="border border-black p-2"
            value={state?.operator ?? ''}
            onChange={(e) => {
              setState((draft) => {
                if (draft === null) {
                  draft = newCondition()
                }
                draft.operator = Operator.parse(
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
        </div>
        <div className="flex-1">
          <h2>Right</h2>
          <ConditionInput
            value={state?.inputs[1] ?? null}
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
            action.condition =
              Condition.nullable().parse(state)
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
    <div>
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
    </div>
  )
}
