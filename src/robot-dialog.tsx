import * as Dialog from '@radix-ui/react-dialog'
import * as Form from '@radix-ui/react-form'
import { ChevronDownIcon } from '@radix-ui/react-icons'
import * as Select from '@radix-ui/react-select'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import clsx from 'clsx'
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import invariant from 'tiny-invariant'
import { useImmer } from 'use-immer'
import { AppContext } from './app-context'
import { Button } from './button'
import { Input } from './input'
import { ItemType, Robot, RobotAlgorithm } from './state'

type RobotDialogProps = {
  robotId?: string
  trigger: React.ReactNode
}

export function RobotDialog(props: RobotDialogProps) {
  const [open, setOpen] = useState(false)
  const [local, setLocal] = useImmer<Partial<Robot>>({})

  useEffect(() => {
    if (open) {
      setLocal({})
    }
  }, [open, props.robotId])

  const { state, setState } = useContext(AppContext)
  const nextRobotId = useMemo(
    () => `${state.nextRobotId}`,
    [state.nextRobotId],
  )

  const id = useMemo(
    () => props.robotId ?? nextRobotId,
    [props.robotId, nextRobotId],
  )

  const robot = useMemo(() => {
    return Robot.parse({
      ...({
        id,
        name: '',
        action: null,
        algorithm: RobotAlgorithm.enum.MineCoal,
      } satisfies Robot),
      ...(state.robots[id] ?? {}),
      ...local,
    })
  }, [id, local, state.robots])

  const onSubmit: React.FormEventHandler<HTMLFormElement> =
    useCallback(
      (ev) => {
        setState((draft) => {
          if (id === `${draft.nextRobotId}`) {
            draft.nextRobotId++
            // prettier-ignore
            invariant((draft.inventory[ItemType.enum.Robot] ?? 0) > 0)
            draft.inventory[ItemType.enum.Robot]! -= 1
            if (
              draft.inventory[ItemType.enum.Robot] === 0
            ) {
              delete draft.inventory[ItemType.enum.Robot]
            }
          }
          draft.robots[id] = robot
        })
        ev.preventDefault()
        setOpen(false)
      },
      [id, robot],
    )

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        {props.trigger}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 backdrop-blur data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out" />
        <Dialog.Content
          className={clsx(
            'data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out',
          )}
        >
          <div className="fixed p-2 inset-0 flex items-center justify-center pointer-events-none">
            <div className="border p-4 pointer-events-auto">
              <Dialog.Title>Add Robot</Dialog.Title>
              <VisuallyHidden asChild>
                <Dialog.Description>
                  TODO
                </Dialog.Description>
              </VisuallyHidden>
              <Form.Root onSubmit={onSubmit}>
                <Form.Field name="id">
                  <Form.Label>ID</Form.Label>
                  <Form.Control asChild>
                    <Input
                      type="text"
                      disabled
                      value={id}
                    />
                  </Form.Control>
                </Form.Field>
                <Form.Field name="name">
                  <Form.Label>Name</Form.Label>
                  <Form.Control asChild>
                    <Input
                      type="text"
                      required
                      onChange={(e) => {
                        setLocal((draft) => {
                          draft.name = e.target.value
                        })
                      }}
                      min={1}
                      value={robot.name}
                    />
                  </Form.Control>
                </Form.Field>
                <Form.Field
                  name="algorithm"
                  className="flex items-center"
                >
                  <Form.Label>Algorithm</Form.Label>
                  <Form.Control asChild>
                    <Select.Root
                      value={robot.algorithm}
                      onValueChange={(algorithm) => {
                        setLocal((draft) => {
                          draft.algorithm =
                            RobotAlgorithm.parse(algorithm)
                        })
                      }}
                    >
                      <Select.Trigger className="bg-white text-black border p-2 flex items-center gap-2">
                        <Select.Value />
                        <Select.Icon>
                          <ChevronDownIcon />
                        </Select.Icon>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content className="p-2 bg-white text-black">
                          <Select.Viewport className="p-2">
                            {Object.values(
                              RobotAlgorithm.enum,
                            ).map((algorithm) => (
                              <Select.Item
                                key={algorithm}
                                value={algorithm}
                                className="p-2 data-[highlighted]:bg-gray-200 select-none"
                              >
                                <Select.ItemText>
                                  {algorithm}
                                </Select.ItemText>
                                <Select.ItemIndicator className="bg-gray-200" />
                              </Select.Item>
                            ))}
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  </Form.Control>
                </Form.Field>
                <Form.Submit asChild>
                  <Button>Save</Button>
                </Form.Submit>
              </Form.Root>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
