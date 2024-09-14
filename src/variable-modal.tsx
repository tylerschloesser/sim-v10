import { useMemo } from 'react'
import shortId from 'short-uuid'
import invariant from 'tiny-invariant'
import { Updater, useImmer } from 'use-immer'
import {
  CustomVariable,
  CustomVariableFunctionType,
  FunctionInputType,
  PartialCustomVariable,
  PartialFunctionInput,
  Context,
  Variable,
  VariableType,
} from './types'

export interface VariableModalContentProps {
  context: Context
  onSave(variable: CustomVariable): void
  variable: CustomVariable | null
}

export function VariableModalContent({
  onSave,
  context,
  ...props
}: VariableModalContentProps) {
  const [state, setState] =
    useImmer<PartialCustomVariable | null>(null)

  const variable = useMemo(
    () =>
      state ??
      props.variable ?? {
        id: shortId().generate(),
        type: VariableType.enum.Custom,
        fn: null,
      },
    [props.variable, state],
  )

  const valid = useMemo(
    () => Variable.safeParse(variable).success,
    [variable],
  )

  const inputOptions = useMemo(() => {
    return Object.values(context.variables)
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
  }, [props.variable, context.variables])

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
            setState((draft) => {
              invariant(
                draft?.type === VariableType.enum.Custom,
              )
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
          setState={setState}
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
      <fieldset className="flex flex-col">
        <legend>Type</legend>
        <label className="flex gap-2">
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
          Constant
        </label>
        <label className="flex gap-2">
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
          Variable
        </label>
      </fieldset>
      {input?.type === FunctionInputType.enum.Constant && (
        <label className="flex flex-col">
          <span>Constant</span>
          <input
            className="p-2 border border-black"
            type="number"
            value={input.value ?? ''}
            onChange={(e) =>
              onChange({
                type: FunctionInputType.enum.Constant,
                value: parseInt(e.target.value),
              })
            }
          />
        </label>
      )}
      {input?.type === FunctionInputType.enum.Variable && (
        <label className="flex flex-col">
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

interface IdentityCustomVariableFunctionFormProps {
  inputOptions: { value: string; label: string }[]
  variable: PartialCustomVariable
  setState: Updater<PartialCustomVariable | null>
}

function IdentityCustomVariableFunctionForm({
  inputOptions,
  variable,
  setState,
}: IdentityCustomVariableFunctionFormProps) {
  const { fn } = variable
  invariant(
    fn?.type === CustomVariableFunctionType.enum.Identity,
  )
  return (
    <FunctionInputForm
      input={fn.input}
      onChange={(input) => {
        setState((draft) => {
          invariant(
            draft?.fn?.type ===
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
