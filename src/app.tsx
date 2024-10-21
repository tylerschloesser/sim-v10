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
import { ReadOnlyInventoryApi } from './inventory-api'
import { RobotCard } from './robot-card'
import { RobotDialog } from './robot-dialog'
import {
  Action,
  ActionType,
  Inventory,
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

function getInitialState(): State {
  const json = localStorage.getItem('state')
  if (json) {
    const state = State.safeParse(JSON.parse(json))
    if (state.success) {
      return state.data
    }
    if (!self.confirm('Failed to parse state. Reset?')) {
      throw Error('Failed to parse state')
    }
  }
  return INITIAL_STATE
}

function useSaveState(state: State) {
  useEffect(() => {
    localStorage.setItem(
      'state',
      JSON.stringify(State.parse(state)),
    )
  }, [state])
}

export function App() {
  const [state, setState] = useImmer<State>(getInitialState)
  const [modal, setModal] = useImmer<Modal | null>(null)

  useSaveState(state)

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
          <div className="flex flex-col gap-2">
            <div className="fixed top-0 right-0 pointer-events-none bg-slate-800 opacity-50">
              <div className="p-2 grid grid-cols-[min-content_min-content] gap-2">
                {inventory.map((item, count) => (
                  <Fragment key={item}>
                    <div>{item}</div>
                    <div>{count}</div>
                  </Fragment>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="opacity-50">
                tick: {state.tick}
              </div>
              <h2>Mine</h2>
              <div className="flex flex-wrap">
                {[
                  ItemType.enum.Coal,
                  ItemType.enum.Stone,
                  ItemType.enum.IronOre,
                  ItemType.enum.CopperOre,
                ].map((item) => (
                  <MineButton key={item} item={item} />
                ))}
              </div>
              <h2>Craft</h2>
              <div className="flex flex-wrap">
                {[
                  ItemType.enum.StoneFurnace,
                  ItemType.enum.BurnerMiningDrill,
                  ItemType.enum.Robot,
                  ItemType.enum.ElectronicCircuit,
                ].map((item) => (
                  <CraftButton key={item} item={item} />
                ))}
              </div>
              <h2>Smelt</h2>
              <div className="flex flex-wrap">
                {[
                  ItemType.enum.IronPlate,
                  ItemType.enum.CopperPlate,
                ].map((item) => (
                  <SmeltButton key={item} item={item} />
                ))}
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
        <button
          className="underline text-gray-400"
          onClick={() => {
            if (!self.confirm('Are you sure?')) {
              return
            }
            setState(INITIAL_STATE)
          }}
        >
          Reset
        </button>
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
    | typeof ItemType.enum.ElectronicCircuit
}

function CraftButton({ item }: CraftButtonProps) {
  const { setState } = useContext(AppContext)
  const onClick = useCallback(() => {
    setState((draft) => {
      draft.queue.push({
        type: ActionType.enum.Craft,
        item,
        count: 1,
        progress: 0,
      })
    })
  }, [item, setState])
  return <Button onClick={onClick}>{item}</Button>
}

interface SmeltButtonProps {
  item:
    | typeof ItemType.enum.IronPlate
    | typeof ItemType.enum.CopperPlate
}

function SmeltButton({ item }: SmeltButtonProps) {
  const { setState } = useContext(AppContext)
  const onClick = useCallback(() => {
    setState((draft) => {
      draft.queue.push({
        type: ActionType.enum.Smelt,
        item,
        count: 1,
        progress: 0,
      })
    })
  }, [setState])

  return <Button onClick={onClick}>{item}</Button>
}
