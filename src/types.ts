import { z } from 'zod'

export const ItemLocation = z.enum(['Queue', 'Available'])
export type ItemLocation = z.infer<typeof ItemLocation>

export const ItemType = z.enum([
  'Stone',
  'Wood',
  'ResearchStone',
  'StoneFurnace',
  'StoneBrick',
])
export type ItemType = z.infer<typeof ItemType>

export const VariableType = z.enum(['Item', 'Custom'])
export type VariableType = z.infer<typeof VariableType>

export const ItemVariable = z.strictObject({
  type: z.literal(VariableType.enum.Item),
  id: z.string(),
  name: z.string(),
  item: ItemType,
  value: z.number().nonnegative(),
})
export type ItemVariable = z.infer<typeof ItemVariable>

export const CustomVariable = z.strictObject({
  type: z.literal(VariableType.enum.Custom),
  id: z.string(),
  name: z.string(),
  value: z.number(),
})

export const Operator = z.enum([
  'lt',
  'lte',
  'gt',
  'gte',
  'eq',
])
export type Operator = z.infer<typeof Operator>

export const ValueType = z.enum(['Variable', 'Constant'])
export type ValueType = z.infer<typeof ValueType>

export const VariableValue = z.strictObject({
  type: z.literal(ValueType.enum.Variable),
  variable: z.string(),
})
export type VariableValue = z.infer<typeof VariableValue>

export const ConstantValue = z.strictObject({
  type: z.literal(ValueType.enum.Constant),
  constant: z.number(),
})
export type ConstantValue = z.infer<typeof ConstantValue>

export const Value = z.discriminatedUnion('type', [
  VariableValue,
  ConstantValue,
])
export type Value = z.infer<typeof Value>

export const Condition = z.strictObject({
  left: Value,
  right: Value,
  operator: Operator,
})
export type Condition = z.infer<typeof Condition>

export const PartialVariableValue = z.strictObject({
  type: z.literal(ValueType.enum.Variable),
  variable: z.string().nullable(),
})
export type PartialVariableValue = z.infer<
  typeof PartialVariableValue
>

export const PartialConstantValue = z.strictObject({
  type: z.literal(ValueType.enum.Constant),
  constant: z.number().nullable(),
})
export type PartialConstantValue = z.infer<
  typeof PartialConstantValue
>

export const PartialValue = z.discriminatedUnion('type', [
  PartialVariableValue,
  PartialConstantValue,
])
export type PartialValue = z.infer<typeof PartialValue>

export const PartialCondition = z.strictObject({
  left: PartialValue.nullable(),
  right: PartialValue.nullable(),
  operator: Operator.nullable(),
})
export type PartialCondition = z.infer<
  typeof PartialCondition
>

const ItemBase = z.strictObject({
  id: z.string(),
  location: ItemLocation,
  condition: Condition.nullable(),
})

export const StoneItem = ItemBase.extend({
  type: z.literal(ItemType.enum.Stone),
})
export type StoneItem = z.infer<typeof StoneItem>

export const WoodItem = ItemBase.extend({
  type: z.literal(ItemType.enum.Wood),
})
export type WoodItem = z.infer<typeof WoodItem>

export const ResearchStoneItem = ItemBase.extend({
  type: z.literal(ItemType.enum.ResearchStone),
  progress: z.number().min(0).max(100),
})
export type ResearchStoneItem = z.infer<
  typeof ResearchStoneItem
>

export const StoneFurnaceItem = ItemBase.extend({
  type: z.literal(ItemType.enum.StoneFurnace),
})
export type StoneFurnaceItem = z.infer<
  typeof StoneFurnaceItem
>

export const StoneBrickItem = ItemBase.extend({
  type: z.literal(ItemType.enum.StoneBrick),
})
export type StoneBrickItem = z.infer<typeof StoneBrickItem>

export const Item = z.discriminatedUnion('type', [
  StoneItem,
  WoodItem,
  ResearchStoneItem,
  StoneFurnaceItem,
  StoneBrickItem,
])
export type Item = z.infer<typeof Item>

export type Inventory = Partial<Record<ItemType, number>>

export interface State {
  tick: number
  drag: string | null
  items: Item[]
  inventory: Inventory
  modal: ModalState
}

export enum ModalStateType {
  Initial = 'initial',
  Edit = 'edit',
  Variable = 'variable',
}

export interface ModalStateBase {
  open: boolean
}

export interface InitialModalState extends ModalStateBase {
  type: ModalStateType.Initial
}

export interface EditModalState extends ModalStateBase {
  type: ModalStateType.Edit
  itemId: string
}

export interface VariableModalState extends ModalStateBase {
  type: ModalStateType.Variable
}

export type ModalState =
  | InitialModalState
  | EditModalState
  | VariableModalState
