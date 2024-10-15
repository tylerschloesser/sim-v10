import { z } from 'zod'

export const ItemType = z.enum(['Coal', 'Stone'])
export type ItemType = z.infer<typeof ItemType>

export const Inventory = z.record(ItemType, z.number())
export type Inventory = z.infer<typeof Inventory>

export const ActionType = z.enum(['Mine'])
export type ActionType = z.infer<typeof ActionType>

export const MineAction = z.strictObject({
  type: z.literal(ActionType.enum.Mine),
  item: z.union([
    z.literal(ItemType.enum.Coal),
    z.literal(ItemType.enum.Stone),
  ]),
  count: z.number().nonnegative(),
  progress: z.number().nonnegative(),
})
type MineAction = z.infer<typeof MineAction>

export const Action = z.discriminatedUnion('type', [
  MineAction,
])
export type Action = z.infer<typeof Action>

export const State = z.strictObject({
  tick: z.number().nonnegative(),
  inventory: Inventory,
  queue: Action.array(),
})
export type State = z.infer<typeof State>
