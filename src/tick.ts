import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import { InventoryApi } from './inventory-api'
import {
  Action,
  ActionType,
  CraftAction,
  ItemType,
  MineAction,
  Robot,
  RobotAlgorithm,
  SmeltAction,
  State,
} from './state'

type HandleActionResult = { complete: boolean }

export function tick(setState: Updater<State>) {
  setState((draft) => {
    draft.tick += 1
    tickQueue(draft)

    for (const robot of Object.values(draft.robots)) {
      tickRobot(robot, draft)
    }
  })
}

function tickQueue(draft: State) {
  const head = draft.queue.at(0)
  if (!head) {
    return
  }

  const result = handleAction(head, draft)

  if (result.complete) {
    draft.queue.shift()
  }
}

function tickRobot(robot: Robot, draft: State) {
  if (!robot.action) {
    setRobotAction(robot)
    invariant(robot.action)
  }

  const result = handleAction(robot.action, draft)

  if (result.complete) {
    robot.action = null
    setRobotAction(robot)
  }
}

function handleAction(
  action: Action,
  draft: State,
): HandleActionResult {
  switch (action.type) {
    case ActionType.enum.Mine: {
      return handleMine(action, draft)
    }
    case ActionType.enum.Craft: {
      return handleCraft(action, draft)
    }
    case ActionType.enum.Smelt: {
      return handleSmelt(action, draft)
    }
    default: {
      invariant(false, 'TODO')
    }
  }
}

function setRobotAction(robot: Robot) {
  invariant(robot.action === null)
  let item: MineAction['item']
  switch (robot.algorithm) {
    case RobotAlgorithm.enum.MineCoal: {
      item = ItemType.enum.Coal
      break
    }
    case RobotAlgorithm.enum.MineStone: {
      item = ItemType.enum.Stone
      break
    }
    case RobotAlgorithm.enum.MineIronOre: {
      item = ItemType.enum.IronOre
      break
    }
    default: {
      invariant(false, 'TODO')
    }
  }
  robot.action = {
    type: ActionType.enum.Mine,
    count: 10,
    item,
    progress: 0,
  }
}

function handleMine(
  action: MineAction,
  draft: State,
): HandleActionResult {
  invariant(action.progress >= 0)
  action.progress += 1

  const target = action.count * 10
  invariant(action.progress <= target)

  if (action.progress % 10 === 0) {
    const inventory = new InventoryApi(draft.inventory)
    inventory.inc(action.item)
  }

  const complete = action.progress === target

  return { complete }
}

function handleCraft(
  action: CraftAction,
  draft: State,
): HandleActionResult {
  invariant(action.progress >= 0)
  invariant(action.count === 1)

  action.progress += 1

  invariant(action.progress <= 20)

  const complete = action.progress === 20

  if (complete) {
    const inventory = new InventoryApi(draft.inventory)
    inventory.inc(action.item)
  }

  return { complete }
}

function handleSmelt(
  action: SmeltAction,
  draft: State,
): HandleActionResult {
  invariant(action.progress >= 0)
  action.progress += 1

  const target = action.count * 20
  invariant(action.progress <= target)

  const inventory = new InventoryApi(draft.inventory)

  if (action.progress % 20 === 0) {
    inventory.inc(action.item)
  }

  const complete = action.progress === target
  if (complete) {
    inventory.inc(ItemType.enum.StoneFurnace)
  }

  return { complete }
}
