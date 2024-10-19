import { useCallback, useContext, useMemo } from 'react'
import invariant from 'tiny-invariant'
import { AppContext } from './app-context'
import { RobotDialog } from './robot-dialog'
import { ItemType, Robot } from './state'
import { getActionLabel, getActionTarget } from './utils'

interface RobotCardProps {
  robot: Robot
}

export function RobotCard({ robot }: RobotCardProps) {
  const { setState } = useContext(AppContext)

  const onClickDelete = useCallback(() => {
    if (window.confirm('Are you sure?')) {
      setState((draft) => {
        invariant(draft.robots[robot.id])
        delete draft.robots[robot.id]
        // prettier-ignore
        draft.inventory[ItemType.enum.Robot] = (draft.inventory[ItemType.enum.Robot] ?? 0) + 1
      })
    }
  }, [])

  const progress = useMemo(() => {
    if (!robot.action) {
      return 0
    }
    return (
      robot.action.progress / getActionTarget(robot.action)
    )
  }, [robot])

  return (
    <div className="flex flex-col">
      <div className="flex gap-2 justify-between p-2 border border-b-0">
        <div>{robot.name}</div>
        <div className="flex gap-2">
          <RobotDialog
            robotId={robot.id}
            trigger={
              <button className="text-gray-400">
                Edit
              </button>
            }
          />
          <button
            className="text-gray-400"
            onClick={onClickDelete}
          >
            Delete
          </button>
        </div>
      </div>
      <div className="p-2 border relative">
        <div
          className="absolute bg-green-800 inset-0 transition-transform ease-linear origin-left"
          style={{
            transform: `scale(${progress}, 1)`,
          }}
        />
        <div className="relative">
          Action:{' '}
          {robot.action
            ? getActionLabel(robot.action)
            : 'Idle'}
        </div>
      </div>
    </div>
  )
}
