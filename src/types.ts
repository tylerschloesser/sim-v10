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

export const Item = z.strictObject({
  id: z.string(),
  location: ItemLocation,
  type: ItemType,
  condition: Condition.nullable(),
})
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

export interface BaseModalState {
  open: boolean
}

export interface InitialModalState extends BaseModalState {
  type: ModalStateType.Initial
}

export interface EditModalState extends BaseModalState {
  type: ModalStateType.Edit
  itemId: string
}

export type ModalState = InitialModalState | EditModalState
