import { useContext } from 'react'
import invariant from 'tiny-invariant'
import { AppContext } from './app-context'
import { RobotDialog } from './robot-dialog'
import { ItemType, Robot } from './state'

interface RobotCardProps {
  robot: Robot
}

export function RobotCard({ robot }: RobotCardProps) {
  const { setState } = useContext(AppContext)
  return (
    <div className="flex flex-col gap-2 p-2 border">
      <div className="flex gap-2 justify-between">
        <div>{robot.name}</div>
        <div className="flex gap-2">
          <RobotDialog
            robotId={robot.id}
            trigger={<div>Edit</div>}
          />
          <div
            onClick={() => {
              if (window.confirm('Are you sure?')) {
                setState((draft) => {
                  invariant(draft.robots[robot.id])
                  delete draft.robots[robot.id]
                  // prettier-ignore
                  draft.inventory[ItemType.enum.Robot] = (draft.inventory[ItemType.enum.Robot] ?? 0) + 1
                })
              }
            }}
          >
            Delete
          </div>
        </div>
      </div>
      <div>
        Action:{' '}
        {robot.action
          ? getActionLabel(robot.action)
          : 'Idle'}
      </div>
    </div>
  )
}
