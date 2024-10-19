import {
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react'
import { Updater, useImmer } from 'use-immer'
import { AppContext, Modal } from './app-context'
import { Button } from './button'
import {
  InventoryApi,
  ReadOnlyInventoryApi,
} from './inventory-api'
import { RobotCard } from './robot-card'
import { RobotDialog } from './robot-dialog'
import {
  Action,
  ActionType,
  Inventory,
  ITEM_TYPE_TO_RECIPE,
  ItemType,
  State,
} from './state'
import { tick } from './tick'
import { getActionLabel, getActionTarget } from './utils'

const TICK_RATE = 100

function useTick(setState: Updater<State>) {
  useEffect(() => {
    const interval = self.setInterval(
      () => tick(setState),
      TICK_RATE,
    )
    return () => {
      self.clearInterval(interval)
    }
  }, [setState])
}

const INITIAL_INVENTORY: Inventory = {
  [ItemType.enum.Stone]: 20,
  [ItemType.enum.IronPlate]: 20,
  [ItemType.enum.Robot]: 1,
}

const INITIAL_STATE: State = {
  tick: 0,
  inventory: INITIAL_INVENTORY,
  queue: [],
  robots: {},
  nextRobotId: 0,
}

export function App() {
  const [state, setState] = useImmer<State>(INITIAL_STATE)
  const [modal, setModal] = useImmer<Modal | null>(null)

  const inventory = useMemo(() => {
    return new ReadOnlyInventoryApi(state.inventory)
  }, [state.inventory])

  useTick(setState)

  return (
    <AppContext.Provider
      value={useMemo(
        () => ({
          state,
          setState,
          inventory,
          modal,
          setModal,
        }),
        [state, setState, inventory, modal, setModal],
      )}
    >
      <div className="p-2">
        <div className="flex flex-col gap-2">
          <div className="flex flex-row gap-2">
            <div className="flex flex-col gap-2">
              <div className="opacity-50">
                tick: {state.tick}
              </div>
              <h2>Mine</h2>
              <div className="flex">
                <MineButton item={ItemType.enum.Coal} />
                <MineButton item={ItemType.enum.Stone} />
                <MineButton item={ItemType.enum.IronOre} />
                <MineButton
                  item={ItemType.enum.CopperOre}
                />
              </div>
              <h2>Craft</h2>
              <div className="flex">
                <CraftButton
                  item={ItemType.enum.StoneFurnace}
                />
                <CraftButton
                  item={ItemType.enum.BurnerMiningDrill}
                />
                <CraftButton item={ItemType.enum.Robot} />
              </div>
              <h2>Smelt</h2>
              <div className="flex">
                <SmeltButton
                  item={ItemType.enum.IronPlate}
                />
                <SmeltButton
                  item={ItemType.enum.CopperPlate}
                />
              </div>
              <h2>Robots</h2>
              <RobotDialog
                trigger={
                  <Button
                    disabled={
                      !inventory.has(ItemType.enum.Robot)
                    }
                  >
                    Add Robot
                  </Button>
                }
              />
              {Object.values(state.robots).map((robot) => (
                <RobotCard key={robot.id} robot={robot} />
              ))}
            </div>
            <div>
              <div className="grid grid-cols-2 gap-2">
                {inventory.map((item, count) => (
                  <Fragment key={item}>
                    <div>{item}</div>
                    <div>{count}</div>
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {state.queue.map((action, i) => (
              <RenderAction
                key={i}
                action={action}
                index={i}
              />
            ))}
          </div>
        </div>
      </div>
    </AppContext.Provider>
  )
}

interface RenderActionProps {
  action: Action
  index: number
}

function RenderAction({
  action,
  index,
}: RenderActionProps) {
  const { setState } = useContext(AppContext)

  const onClickDelete = useCallback(() => {
    setState((draft) => {
      draft.queue.splice(index, 1)
    })
  }, [index, setState])

  const target = useMemo(
    () => getActionTarget(action),
    [action],
  )

  return (
    <div className="border p-2 relative">
      <div
        className="absolute bg-green-800 inset-0 transition-transform ease-linear origin-left"
        style={{
          transform: `scale(${action.progress / target}, 1)`,
        }}
      />
      <div className="relative flex justify-between">
        <div>{getActionLabel(action)}</div>
        <div>
          <button
            className="underline"
            onClick={onClickDelete}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

interface MineButtonProps {
  item:
    | typeof ItemType.enum.Coal
    | typeof ItemType.enum.Stone
    | typeof ItemType.enum.IronOre
    | typeof ItemType.enum.CopperOre
}

function MineButton({ item }: MineButtonProps) {
  const { setState } = useContext(AppContext)
  const onClick = useCallback(() => {
    setState((draft) => {
      const tail = draft.queue.at(-1)
      if (tail?.item === item) {
        tail.count += 1
        return
      }
      draft.queue.push({
        type: ActionType.enum.Mine,
        item,
        count: 1,
        progress: 0,
      })
    })
  }, [setState])
  return <Button onClick={onClick}>{item}</Button>
}

interface CraftButtonProps {
  item:
    | typeof ItemType.enum.StoneFurnace
    | typeof ItemType.enum.BurnerMiningDrill
    | typeof ItemType.enum.Robot
}

function CraftButton({ item }: CraftButtonProps) {
  const { setState, inventory } = useContext(AppContext)

  const recipe = useMemo(
    () => ITEM_TYPE_TO_RECIPE[item],
    [item],
  )

  const disabled = useMemo(
    () => !inventory.hasRecipe(recipe),
    [inventory, recipe],
  )

  const onClick = useCallback(() => {
    setState((draft) => {
      const inventory = new InventoryApi(draft.inventory)
      inventory.subRecipe(recipe)
      draft.queue.push({
        type: ActionType.enum.Craft,
        item,
        count: 1,
        progress: 0,
      })
    })
  }, [item, setState, recipe])
  return (
    <Button onClick={onClick} disabled={disabled}>
      {item}
    </Button>
  )
}

interface SmeltButtonProps {
  item:
    | typeof ItemType.enum.IronPlate
    | typeof ItemType.enum.CopperPlate
}

function SmeltButton({ item }: SmeltButtonProps) {
  const { state, setState, inventory } =
    useContext(AppContext)

  const recipe = useMemo(
    () => ITEM_TYPE_TO_RECIPE[item],
    [],
  )

  const disabled = useMemo(() => {
    if (!inventory.hasRecipe(recipe)) {
      return true
    }

    const tail = state.queue.at(-1)
    if (
      tail?.type === ActionType.enum.Smelt &&
      tail.item === item
    ) {
      return false
    }

    return !inventory.has(ItemType.enum.StoneFurnace)
  }, [inventory, state.queue, recipe])

  const onClick = useCallback(() => {
    setState((draft) => {
      const inventory = new InventoryApi(draft.inventory)
      inventory.subRecipe(recipe)

      const tail = draft.queue.at(-1)
      if (
        tail?.type === ActionType.enum.Smelt &&
        tail.item === item
      ) {
        tail.count += 1
      } else {
        inventory.dec(ItemType.enum.StoneFurnace)
        draft.queue.push({
          type: ActionType.enum.Smelt,
          item,
          count: 1,
          progress: 0,
        })
      }
    })
  }, [setState, recipe])

  return (
    <Button onClick={onClick} disabled={disabled}>
      {item}
    </Button>
  )
}
