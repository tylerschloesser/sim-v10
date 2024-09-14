import { z } from 'zod'

export const ItemType = z.enum(['Stone', 'Wood'])
export type ItemType = z.infer<typeof ItemType>

export const VariableType = z.enum(['Item', 'Custom'])
export type VariableType = z.infer<typeof VariableType>

export const VariableBase = z.strictObject({
  id: z.string().min(1),
})

export const ItemVariable = VariableBase.extend({
  type: z.literal(VariableType.enum.Item),
  item: ItemType,
})
export type ItemVariable = z.infer<typeof ItemVariable>

export const CustomVariableFunctionType = z.enum([
  'Identity',
  'Multiply',
])
export type CustomVariableFunctionType = z.infer<
  typeof CustomVariableFunctionType
>

export const FunctionInputType = z.enum([
  'Variable',
  'Constant',
])
export type FunctionInputType = z.infer<
  typeof FunctionInputType
>

export const VariableFunctionInput = z.strictObject({
  type: z.literal(FunctionInputType.enum.Variable),
  id: z.string(),
})
export type VariableFunctionInput = z.infer<
  typeof VariableFunctionInput
>

export const PartialVariableFunctionInput = z.strictObject({
  type: z.literal(FunctionInputType.enum.Variable),
  id: z.string().nullable(),
})
export type PartialVariableFunctionInput = z.infer<
  typeof PartialVariableFunctionInput
>

export const ConstantFunctionInput = z.strictObject({
  type: z.literal(FunctionInputType.enum.Constant),
  value: z.number(),
})
export type ConstantFunctionInput = z.infer<
  typeof ConstantFunctionInput
>

export const PartialConstantFunctionInput = z.strictObject({
  type: z.literal(FunctionInputType.enum.Constant),
  value: z.number().nullable(),
})
export type PartialConstantFunctionInput = z.infer<
  typeof PartialConstantFunctionInput
>

export const FunctionInput = z.discriminatedUnion('type', [
  VariableFunctionInput,
  ConstantFunctionInput,
])
export type FunctionInput = z.infer<typeof FunctionInput>

export const PartialFunctionInput = z.discriminatedUnion(
  'type',
  [
    PartialVariableFunctionInput,
    PartialConstantFunctionInput,
  ],
)
export type PartialFunctionInput = z.infer<
  typeof PartialFunctionInput
>

export const IdentityCustomVariableFunction =
  z.strictObject({
    type: z.literal(
      CustomVariableFunctionType.enum.Identity,
    ),
    input: FunctionInput,
  })
export type IdentityCustomVariableFunction = z.infer<
  typeof IdentityCustomVariableFunction
>

export const PartialIdentityCustomVariableFunction =
  z.strictObject({
    type: z.literal(
      CustomVariableFunctionType.enum.Identity,
    ),
    input: PartialFunctionInput.nullable(),
  })
export type PartialIdentityCustomVariableFunction = z.infer<
  typeof PartialIdentityCustomVariableFunction
>

export const MultiplyCustomVariableFunction =
  z.strictObject({
    type: z.literal(
      CustomVariableFunctionType.enum.Multiply,
    ),
    inputs: z.tuple([FunctionInput, FunctionInput]),
  })
export type MultiplyCustomVariableFunction = z.infer<
  typeof MultiplyCustomVariableFunction
>

export const PartialMultiplyCustomVariableFunction =
  z.strictObject({
    type: z.literal(
      CustomVariableFunctionType.enum.Multiply,
    ),
    inputs: z.tuple([
      PartialFunctionInput.nullable(),
      PartialFunctionInput.nullable(),
    ]),
  })
export type PartialMultiplyCustomVariableFunction = z.infer<
  typeof PartialMultiplyCustomVariableFunction
>

export const CustomVariableFunction = z.discriminatedUnion(
  'type',
  [
    IdentityCustomVariableFunction,
    MultiplyCustomVariableFunction,
  ],
)
export type CustomVariableFunction = z.infer<
  typeof CustomVariableFunction
>

export const PartialCustomVariableFunction =
  z.discriminatedUnion('type', [
    PartialIdentityCustomVariableFunction,
    PartialMultiplyCustomVariableFunction,
  ])
export type PartialCustomVariableFunction = z.infer<
  typeof PartialCustomVariableFunction
>

export const CustomVariable = VariableBase.extend({
  type: z.literal(VariableType.enum.Custom),
  name: z.string().nullable(),
  fn: CustomVariableFunction,
})
export type CustomVariable = z.infer<typeof CustomVariable>

export const PartialCustomVariable = VariableBase.extend({
  type: z.literal(VariableType.enum.Custom),
  name: z.string().nullable(),
  fn: PartialCustomVariableFunction.nullable(),
})
export type PartialCustomVariable = z.infer<
  typeof PartialCustomVariable
>

export const Variable = z.discriminatedUnion('type', [
  ItemVariable,
  CustomVariable,
])
export type Variable = z.infer<typeof Variable>

export const Operator = z.enum([
  'lt',
  'lte',
  'gt',
  'gte',
  'eq',
])
export type Operator = z.infer<typeof Operator>

export const Condition = z.strictObject({
  inputs: z.tuple([z.string(), z.string()]),
  operator: Operator,
})
export type Condition = z.infer<typeof Condition>

export const PartialCondition = z.strictObject({
  inputs: z.tuple([
    z.string().nullable(),
    z.string().nullable(),
  ]),
  operator: Operator.nullable(),
})
export type PartialCondition = z.infer<
  typeof PartialCondition
>

export const ActionType = z.enum([
  'GatherStone',
  'GatherWood',
])
export type ActionType = z.infer<typeof ActionType>

const ActionBase = z.strictObject({
  id: z.string(),
  condition: Condition.nullable(),
  output: z.string().nullable(),
})

const PartialActionBase = z.strictObject({
  id: z.string(),
  condition: PartialCondition.nullable(),
  output: z.string().nullable(),
})

export const GatherStoneAction = ActionBase.extend({
  type: z.literal(ActionType.enum.GatherStone),
})
export type GatherStoneAction = z.infer<
  typeof GatherStoneAction
>

export const PartialGatherStoneAction =
  PartialActionBase.extend({
    type: z.literal(ActionType.enum.GatherStone),
  })
export type PartialGatherStoneAction = z.infer<
  typeof PartialGatherStoneAction
>

export const GatherWoodAction = ActionBase.extend({
  type: z.literal(ActionType.enum.GatherWood),
})
export type GatherWoodAction = z.infer<
  typeof GatherWoodAction
>

export const PartialGatherWoodAction =
  PartialActionBase.extend({
    type: z.literal(ActionType.enum.GatherWood),
  })
export type PartialGatherWoodAction = z.infer<
  typeof PartialGatherWoodAction
>

export const Action = z.discriminatedUnion('type', [
  GatherStoneAction,
  GatherWoodAction,
])
export type Action = z.infer<typeof Action>

export const PartialAction = z.discriminatedUnion('type', [
  PartialGatherStoneAction,
  PartialGatherWoodAction,
])
export type PartialAction = z.infer<typeof PartialAction>

export const Store = z.strictObject({
  id: z.string(),
  item: ItemType,
  quantity: z.number(),
})
export type Store = z.infer<typeof Store>

export interface Context {
  tick: number
  drag: string | null
  modal: ModalState | null
  variables: Record<string, Variable>
  actions: Record<string, Action>
  stores: Record<string, Store>
}

export enum ModalStateType {
  Action = 'action',
  Variable = 'variable',
}

export interface ActionModalState {
  type: ModalStateType.Action
  actionId: string
}

export interface VariableModalState {
  type: ModalStateType.Variable
  variable: CustomVariable | null
}

export type ModalState =
  | ActionModalState
  | VariableModalState
