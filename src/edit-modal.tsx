import { isEqual } from 'lodash-es'
import { useCallback, useMemo } from 'react'
import invariant from 'tiny-invariant'
import { Updater, useImmer } from 'use-immer'
import {
  Condition,
  ItemType,
  ModalStateType,
  Operator,
  PartialCondition,
  PartialValue,
  State,
  ValueType,
} from './types'

export interface EditModalContentProps {
  state: State
  setState: Updater<State>
  onClose(): void
}

export function EditModalContent({
  state,
  setState,
  onClose,
}: EditModalContentProps) {
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
    <div className="flex flex-col gap-2">
      <div className="text-sm">Item ID: {modal.itemId}</div>
      <div className="font-bold">Condition</div>
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
      {item.type === ItemType.enum.Stone && (
        <>
          <div className="font-bold">Output</div>
          <div>
            <select
              value={item.output ?? ''}
              onChange={(e) => {
                setState((draft) => {
                  const item = draft.items.find(
                    ({ id }) => id === modal.itemId,
                  )
                  invariant(
                    item?.type === ItemType.enum.Stone,
                  )
                  item.output = e.target.value
                })
              }}
            >
              <option value="" disabled>
                Choose Variable
              </option>
              {Object.values(state.variables).map(
                (variable) => (
                  <option key={variable.id}>
                    {variable.id}
                  </option>
                ),
              )}
            </select>
          </div>
        </>
      )}
      <button
        className="border border-black p-2 disabled:opacity-50 hover:opacity-75 active:opacity-50"
        disabled={!valid || !dirty}
        onClick={() => {
          setState((draft) => {
            const item = draft.items.find(
              ({ id }) => id === modal.itemId,
            )
            invariant(item)
            item.condition = Condition.parse(condition)
          })
          onClose()
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
