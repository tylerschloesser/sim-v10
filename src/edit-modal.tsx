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

export function EditModalContent() {
  const { context, setContext } = useContext(AppContext)
  const { modal } = context
  invariant(modal?.type === ModalStateType.Edit)

  const item = context.items.find(
    ({ id }) => id === modal.itemId,
  )
  invariant(item)

  const [condition, setCondition] =
    useImmer<PartialCondition>(
      item.condition ?? {
        inputs: [null, null],
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
    (value: string) => {
      setCondition((draft) => {
        draft.inputs[0] = value
      })
    },
    [setCondition],
  )

  const onChangeRight = useCallback(
    (value: string) => {
      setCondition((draft) => {
        draft.inputs[1] = value
      })
    },
    [setCondition],
  )

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm">Item ID: {modal.itemId}</div>
      <div className="font-bold">Condition</div>
      <div className="flex gap-2">
        <div className="flex-1">
          <h2>Left</h2>
          <ConditionInput
            value={condition.inputs[0]}
            onChange={onChangeLeft}
            context={context}
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
          <ConditionInput
            value={condition.inputs[1]}
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
