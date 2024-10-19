import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import {
  InventoryApi,
  ReadOnlyInventoryApi,
} from './inventory-api'
import {
  Action,
  ActionType,
  Condition,
  CraftAction,
  ItemType,
  MineAction,
  Robot,
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
    setRobotAction(robot, draft)
  }

  if (robot.action) {
    const result = handleAction(robot.action, draft)
    if (result.complete) {
      robot.action = null
    }
  }

  if (!robot.action) {
    setRobotAction(robot, draft)
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

function setRobotAction(robot: Robot, draft: State) {
  invariant(robot.action === null)
  for (const step of robot.algorithm) {
    if (isConditionSatisified(step.condition, draft)) {
      robot.action = step.action
      break
    }
  }
}

function isConditionSatisified(
  condition: Condition,
  draft: State,
) {
  const left = resolveConditionValue(condition.left, draft)
  const right = resolveConditionValue(
    condition.right,
    draft,
  )

  if (left === null || right === null) {
    return false
  }

  switch (condition.operator) {
    case 'lt': {
      return left < right
    }
    case 'lte': {
      return left <= right
    }
    case 'eq': {
      return left === right
    }
    case 'gte': {
      return left >= right
    }
    case 'gt': {
      return left > right
    }
    default: {
      invariant(false, 'TODO')
    }
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

function resolveConditionValue(
  value: string,
  draft: State,
) {
  const item = ItemType.safeParse(value)
  if (item.success) {
    const inventory = new ReadOnlyInventoryApi(
      draft.inventory,
    )
    return inventory.get(item.data)
  }
  const num = parseInt(value, 10)
  if (Number.isNaN(num)) {
    return null
  }
  return num
}
