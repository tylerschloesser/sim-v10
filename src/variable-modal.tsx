import { useEffect, useMemo } from 'react'
import shortId from 'short-uuid'
import { useImmer } from 'use-immer'
import {
  CustomVariable,
  PartialCustomVariable,
  Variable,
  VariableType,
} from './types'

export interface VariableModalContentProps {
  onSave(variable: CustomVariable): void
  variable: CustomVariable | null
}

export function VariableModalContent({
  onSave,
  ...props
}: VariableModalContentProps) {
  const [variable, setVariable] =
    useImmer<PartialCustomVariable>({
      id: shortId().generate(),
      type: VariableType.enum.Custom,
    })

  useEffect(() => {
    if (props.variable) {
      setVariable({ ...props.variable })
    } else {
      setVariable({
        id: shortId().generate(),
        type: VariableType.enum.Custom,
      })
    }
  }, [props.variable])

  const valid = useMemo(
    () => Variable.safeParse(variable).success,
    [variable],
  )

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
