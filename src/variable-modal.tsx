import { useEffect, useMemo } from 'react'
import shortId from 'short-uuid'
import { useImmer } from 'use-immer'
import {
  CustomVariable,
  PartialCustomVariable,
  State,
  Variable,
  VariableType,
} from './types'

export interface VariableModalContentProps {
  state: State
  onSave(variable: CustomVariable): void
  variable: CustomVariable | null
}

export function VariableModalContent({
  state,
  onSave,
  ...props
}: VariableModalContentProps) {
  const [variable, setVariable] =
    useImmer<PartialCustomVariable>({
      id: shortId().generate(),
      type: VariableType.enum.Custom,
      input: null,
    })

  useEffect(() => {
    if (props.variable) {
      setVariable({ ...props.variable })
    } else {
      setVariable({
        id: shortId().generate(),
        type: VariableType.enum.Custom,
        input: null,
      })
    }
  }, [props.variable])

  const valid = useMemo(
    () => Variable.safeParse(variable).success,
    [variable],
  )

  const inputOptions = useMemo(() => {
    return Object.values(state.variables)
      .filter(
        (variable) => variable.id !== props.variable?.id,
      )
      .map((variable) => ({
        value: variable.id,
        label:
          variable.type === VariableType.enum.Item
            ? variable.item
            : variable.id,
      }))
  }, [props.variable, state.variables])

  return (
    <div className="flex flex-col gap-2 min-w-80">
      <label className="flex flex-col">
        <span>ID</span>
        <input
          className="border border-black p-2 read-only:bg-inherit"
          type="text"
          value={variable.id ?? ''}
          readOnly
        />
      </label>
      <select
        value={variable.input ?? ''}
        onChange={(e) => {
          setVariable((draft) => {
            draft.input = e.target.value
          })
        }}
        className="p-2 border border-black"
      >
        {inputOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        className="border border-black p-2 hover:opacity-75 active:opacity-50 disabled:opacity-50"
        disabled={!valid}
        onClick={() => {
          onSave(CustomVariable.parse(variable))
        }}
      >
        Save
      </button>
    </div>
  )
}
