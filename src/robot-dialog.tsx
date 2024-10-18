import * as Dialog from '@radix-ui/react-dialog'
import * as Form from '@radix-ui/react-form'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import clsx from 'clsx'
import {
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { useImmer } from 'use-immer'
import { AppContext } from './app-context'
import { Button } from './button'
import { Input } from './input'
import { Robot } from './state'

type RobotDialogProps = {
  robotId?: string
  trigger: React.ReactNode
}

export function RobotDialog(props: RobotDialogProps) {
  const [open, setOpen] = useState(false)
  const [local, setLocal] = useImmer<Partial<Robot>>({})

  const { state, setState } = useContext(AppContext)
  const nextRobotId = useMemo(
    () => `${state.nextRobotId}`,
    [state.nextRobotId],
  )

  const id = useMemo(
    () => props.robotId ?? nextRobotId,
    [props.robotId, nextRobotId],
  )

  const onSubmit: React.FormEventHandler<HTMLFormElement> =
    useCallback(
      (ev) => {
        setState((draft) => {
          draft.robots[id] = Robot.parse({ id, ...local })
        })
        ev.preventDefault()
        setOpen(false)
      },
      [id, local],
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
                      value={local.name ?? ''}
                    />
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

export const RobotDialogTrigger = Dialog.Trigger
