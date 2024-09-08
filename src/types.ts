import { z } from 'zod'

export const ItemLocation = z.enum(['Queue', 'Available'])
export type ItemLocation = z.infer<typeof ItemLocation>

export const ItemType = z.enum([
  'Stone',
  'Wood',
  'ResearchStone',
])
export type ItemType = z.infer<typeof ItemType>

export const Operator = z.enum([
  'lt',
  'lte',
  'gt',
  'gte',
  'eq',
])
export type Operator = z.infer<typeof Operator>

export const Condition = z.strictObject({
  left: ItemType,
  right: z.number(),
  operator: Operator,
})
export type Condition = z.infer<typeof Condition>

export const PartialCondition = Condition.partial()
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

export const Item = z.discriminatedUnion('type', [
  StoneItem,
  WoodItem,
  ResearchStoneItem,
])
export type Item = z.infer<typeof Item>

export interface State {
  tick: number
  drag: string | null
  items: Item[]
  inventory: Partial<Record<ItemType, number>>
  modal: ModalState
}

export enum ModalStateType {
  Initial = 'initial',
  Edit = 'edit',
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

export type ModalState = InitialModalState | EditModalState
