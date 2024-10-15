import { z } from 'zod'

export const ItemType = z.enum([
  'Coal',
  'Stone',
  'StoneFurnace',
  'IronOre',
  'IronPlate',
])
export type ItemType = z.infer<typeof ItemType>

export const Inventory = z.record(ItemType, z.number())
export type Inventory = z.infer<typeof Inventory>

export const ActionType = z.enum(['Mine', 'Craft', 'Smelt'])
export type ActionType = z.infer<typeof ActionType>

export const MineAction = z.strictObject({
  type: z.literal(ActionType.enum.Mine),
  item: z.union([
    z.literal(ItemType.enum.Coal),
    z.literal(ItemType.enum.Stone),
    z.literal(ItemType.enum.IronOre),
  ]),
  count: z.number().nonnegative(),
  progress: z.number().nonnegative(),
})
type MineAction = z.infer<typeof MineAction>

export const CraftAction = z.strictObject({
  type: z.literal(ActionType.enum.Craft),
  item: z.literal(ItemType.enum.StoneFurnace),
  count: z.literal(1),
  progress: z.number().nonnegative(),
})
export type CraftAction = z.infer<typeof CraftAction>

export const SmeltAction = z.strictObject({
  type: z.literal(ActionType.enum.Smelt),
  item: z.literal(ItemType.enum.IronPlate),
  count: z.number().nonnegative().int(),
  progress: z.number().nonnegative(),
})
export type SmeltAction = z.infer<typeof SmeltAction>

export const Action = z.discriminatedUnion('type', [
  MineAction,
  CraftAction,
  SmeltAction,
])
export type Action = z.infer<typeof Action>

export const State = z.strictObject({
  tick: z.number().nonnegative(),
  inventory: Inventory,
  queue: Action.array(),
})
export type State = z.infer<typeof State>

export const ITEM_TYPE_TO_RECIPE = {
  [ItemType.enum.StoneFurnace]: {
    [ItemType.enum.Stone]: 10,
  },
}
