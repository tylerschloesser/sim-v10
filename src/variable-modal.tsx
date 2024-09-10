import { useEffect, useMemo } from 'react'
import shortId from 'short-uuid'
import { useImmer } from 'use-immer'
import { PartialVariable, Variable } from './types'

export interface VariableModalContentProps {
  onSave(variable: Variable): void
  variable: Variable | null
}

export function VariableModalContent({
  onSave,
  ...props
}: VariableModalContentProps) {
  const [variable, setVariable] = useImmer<PartialVariable>(
    {
      id: null,
    },
  )

  useEffect(() => {
    if (props.variable) {
      setVariable({ ...props.variable })
    } else {
      setVariable({ id: shortId().generate() })
    }
  }, [props.variable])

  const valid = useMemo(
    () => Variable.safeParse(variable).success,
    [variable],
  )

  return (
    <div className="flex flex-col gap-2">
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
          onSave(Variable.parse(variable))
        }}
      >
        Save
      </button>
    </div>
  )
}
