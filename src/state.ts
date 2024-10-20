import { z } from 'zod'

export const ItemType = z.enum([
  'Coal',
  'Stone',
  'StoneFurnace',
  'BurnerMiningDrill',
  'IronOre',
  'IronPlate',
  'CopperOre',
  'CopperPlate',
  'Robot',
  'ElectronicCircuit',
])
export type ItemType = z.infer<typeof ItemType>

export const Inventory = z.record(ItemType, z.number())
export type Inventory = z.infer<typeof Inventory>

export const ActionType = z.enum(['Mine', 'Craft', 'Smelt'])
export type ActionType = z.infer<typeof ActionType>

export const MineActionItemType = z.enum([
  ItemType.enum.Coal,
  ItemType.enum.Stone,
  ItemType.enum.IronOre,
  ItemType.enum.CopperOre,
])
export type MineActionItemType = z.infer<
  typeof MineActionItemType
>

export const MineAction = z.strictObject({
  type: z.literal(ActionType.enum.Mine),
  item: MineActionItemType,
  count: z.number().nonnegative(),
  progress: z.number().nonnegative(),
})
export type MineAction = z.infer<typeof MineAction>

export const CraftActionItemType = z.enum([
  ItemType.enum.StoneFurnace,
  ItemType.enum.BurnerMiningDrill,
  ItemType.enum.Robot,
  ItemType.enum.ElectronicCircuit,
])
export type CraftActionItemType = z.infer<
  typeof CraftActionItemType
>

export const CraftAction = z.strictObject({
  type: z.literal(ActionType.enum.Craft),
  item: CraftActionItemType,
  count: z.literal(1),
  progress: z.number().nonnegative(),
})
export type CraftAction = z.infer<typeof CraftAction>

export const SmeltActionItemType = z.enum([
  ItemType.enum.IronPlate,
  ItemType.enum.CopperPlate,
])
export type SmeltActionItemType = z.infer<
  typeof SmeltActionItemType
>

export const SmeltAction = z.strictObject({
  type: z.literal(ActionType.enum.Smelt),
  item: SmeltActionItemType,
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

export const Operator = z.enum([
  'lt',
  'lte',
  'eq',
  'gte',
  'gt',
])
export type Operator = z.infer<typeof Operator>

export const Condition = z.strictObject({
  left: z.string(),
  operator: Operator,
  right: z.string(),
})
export type Condition = z.infer<typeof Condition>

export const RobotAlgorithmStep = z.strictObject({
  action: Action,
  condition: Condition,
})
export type RobotAlgorithmStep = z.infer<
  typeof RobotAlgorithmStep
>

export const Robot = z.strictObject({
  id: z.string(),
  name: z.string(),
  action: Action.nullable(),
  algorithm: RobotAlgorithmStep.array(),
})
export type Robot = z.infer<typeof Robot>

export const State = z.strictObject({
  tick: z.number().nonnegative(),
  inventory: Inventory,
  queue: Action.array(),
  robots: z.record(z.string(), Robot),
  nextRobotId: z.number().nonnegative().int(),
})
export type State = z.infer<typeof State>

export const ITEM_TYPE_TO_RECIPE = {
  [ItemType.enum.StoneFurnace]: {
    [ItemType.enum.Stone]: 10,
  },
  [ItemType.enum.BurnerMiningDrill]: {
    [ItemType.enum.Stone]: 10,
    [ItemType.enum.IronPlate]: 10,
  },
  [ItemType.enum.Robot]: {
    [ItemType.enum.IronPlate]: 10,
  },
  [ItemType.enum.IronPlate]: {
    [ItemType.enum.IronOre]: 1,
    [ItemType.enum.Coal]: 1,
  },
  [ItemType.enum.CopperPlate]: {
    [ItemType.enum.CopperOre]: 1,
    [ItemType.enum.Coal]: 1,
  },
  [ItemType.enum.ElectronicCircuit]: {
    [ItemType.enum.IronPlate]: 2,
    [ItemType.enum.CopperPlate]: 3,
  },
}
