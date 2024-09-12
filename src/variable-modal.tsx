import { useEffect, useMemo } from 'react'
import shortId from 'short-uuid'
import invariant from 'tiny-invariant'
import { Updater, useImmer } from 'use-immer'
import {
  CustomVariable,
  CustomVariableFunctionType,
  FunctionInput,
  FunctionInputType,
  PartialCustomVariable,
  PartialFunctionInput,
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
      fn: null,
    })

  useEffect(() => {
    if (props.variable) {
      setVariable({ ...props.variable })
    } else {
      setVariable({
        id: shortId().generate(),
        type: VariableType.enum.Custom,
        fn: null,
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

  const functionOptions = useMemo(() => {
    return [
      CustomVariableFunctionType.enum.Identity,
      CustomVariableFunctionType.enum.Multiply,
    ]
  }, [])

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
      <label className="flex flex-col">
        <span>Function</span>
        <select
          className="p-2 border border-black"
          value={variable.fn?.type ?? ''}
          onChange={(e) => {
            setVariable((draft) => {
              const type = CustomVariableFunctionType.parse(
                e.target.value,
              )
              switch (type) {
                case CustomVariableFunctionType.enum
                  .Identity:
                  draft.fn = {
                    type: CustomVariableFunctionType.enum
                      .Identity,
                    input: null,
                  }
                  break
                case CustomVariableFunctionType.enum
                  .Multiply:
                  draft.fn = {
                    type: CustomVariableFunctionType.enum
                      .Multiply,
                    inputs: [null, null],
                  }
                  break
                default:
                  invariant(false)
              }
            })
          }}
        >
          <option value="" disabled>
            Choose
          </option>
          {functionOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      {variable.fn?.type ===
        CustomVariableFunctionType.enum.Identity && (
        <IdentityCustomVariableFunctionForm
          variable={variable}
          setVariable={setVariable}
          inputOptions={inputOptions}
        />
      )}
      {variable.fn?.type ===
        CustomVariableFunctionType.enum.Multiply && (
        <MultiplyCustomVariableFunctionForm />
      )}
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

interface IdentityCustomVariableFunctionFormProps {
  inputOptions: { value: string; label: string }[]
  variable: PartialCustomVariable
  setVariable: Updater<PartialCustomVariable>
}

interface FunctionInputFormProps {
  input: PartialFunctionInput | null
  onChange: (value: PartialFunctionInput) => void
  inputOptions: { value: string; label: string }[]
}

function FunctionInputForm({
  input,
  onChange,
  inputOptions,
}: FunctionInputFormProps) {
  return (
    <>
      <fieldset>
        <label>
          Constant
          <input
            type="radio"
            value={FunctionInputType.enum.Constant}
            checked={
              input?.type ===
              FunctionInputType.enum.Constant
            }
            onChange={() =>
              onChange({
                type: FunctionInputType.enum.Constant,
                value: null,
              })
            }
          />
        </label>
        <label>
          Variable
          <input
            type="radio"
            value={FunctionInputType.enum.Variable}
            checked={
              input?.type ===
              FunctionInputType.enum.Variable
            }
            onChange={() =>
              onChange({
                type: FunctionInputType.enum.Variable,
                id: null,
              })
            }
          />
        </label>
      </fieldset>
      {input?.type === FunctionInputType.enum.Constant && (
        <label>
          <span>Constant</span>
          <input type="number" value={input.value ?? ''} />
        </label>
      )}
      {input?.type === FunctionInputType.enum.Variable && (
        <label>
          <span>Variable</span>
          <select
            className="p-2 border border-black"
            value={input.id ?? ''}
            onChange={(e) =>
              onChange({
                type: FunctionInputType.enum.Variable,
                id: e.target.value,
              })
            }
          >
            <option value="" disabled>
              Choose
            </option>
            {inputOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>
      )}
    </>
  )
}

function IdentityCustomVariableFunctionForm({
  inputOptions,
  variable,
  setVariable,
}: IdentityCustomVariableFunctionFormProps) {
  const { fn } = variable
  invariant(
    fn?.type === CustomVariableFunctionType.enum.Identity,
  )
  return (
    <FunctionInputForm
      input={fn.input}
      onChange={(input) => {
        setVariable((draft) => {
          invariant(
            draft.fn?.type ===
              CustomVariableFunctionType.enum.Identity,
          )
          draft.fn!.input = input
        })
      }}
      inputOptions={inputOptions}
    />
  )
}

function MultiplyCustomVariableFunctionForm() {
  return <div>Multiply</div>
}
