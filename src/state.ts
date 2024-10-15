import { z } from 'zod'

export const ItemType = z.enum(['Coal', 'Stone'])
export type ItemType = z.infer<typeof ItemType>

export const Inventory = z.record(ItemType, z.number())
export type Inventory = z.infer<typeof Inventory>

export const State = z.strictObject({
  tick: z.number().nonnegative(),
  inventory: Inventory,
})
export type State = z.infer<typeof State>
