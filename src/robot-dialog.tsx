import * as Dialog from '@radix-ui/react-dialog'
import { ChevronDownIcon } from '@radix-ui/react-icons'
import * as Select from '@radix-ui/react-select'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import clsx from 'clsx'
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import invariant from 'tiny-invariant'
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

  const { state, setState } = useContext(AppContext)

  const id = useMemo(
    () => props.robotId ?? `${state.nextRobotId}`,
    [props.robotId, state.nextRobotId],
  )

  const defaultValues = useMemo<Robot>(() => {
    return (
      state.robots[id] ?? {
        id,
        action: null,
        name: '',
        algorithm: RobotAlgorithm.enum.MineCoal,
      }
    )
  }, [id, state.robots])

  const form = useForm({
    validatorAdapter: zodValidator(),
    validators: {
      onChange: Robot,
    },
    defaultValues,
    onSubmit: async ({ value }) => {
      setState((draft) => {
        if (value.id === `${draft.nextRobotId}`) {
          invariant(!draft.robots[value.id])

          draft.nextRobotId++

          // prettier-ignore
          invariant((draft.inventory[ItemType.enum.Robot] ?? 0) > 0)

          draft.inventory[ItemType.enum.Robot]! -= 1
          if (draft.inventory[ItemType.enum.Robot] === 0) {
            delete draft.inventory[ItemType.enum.Robot]
          }
        }
        draft.robots[value.id] = value
      })
      setOpen(false)
    },
  })

  useEffect(() => {
    if (open) {
      form.reset()
    }
  }, [open])

  const onSubmit: React.FormEventHandler<HTMLFormElement> =
    useCallback(
      (e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      },
      [form.handleSubmit],
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
              <form onSubmit={onSubmit}>
                <form.Field
                  name="id"
                  children={(field) => (
                    <>
                      <label htmlFor={field.name}>ID</label>
                      <Input
                        type="text"
                        disabled
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                      />
                    </>
                  )}
                />

                <form.Field
                  name="name"
                  children={(field) => (
                    <>
                      <label htmlFor={field.name}>
                        Name
                      </label>
                      <Input
                        type="text"
                        required
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(e.target.value)
                        }
                      />
                    </>
                  )}
                />

                <form.Field
                  name="algorithm"
                  children={(field) => (
                    <>
                      <label htmlFor={field.name}>
                        Algorithm
                      </label>
                      <Select.Root
                        required
                        name={field.name}
                        value={field.state.value}
                        onValueChange={(algorithm) => {
                          field.handleChange(
                            RobotAlgorithm.parse(algorithm),
                          )
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
                    </>
                  )}
                />

                <form.Subscribe
                  selector={(state) => [state.canSubmit]}
                  children={([canSubmit]) => (
                    <Button
                      type="submit"
                      disabled={!canSubmit}
                    >
                      Save
                    </Button>
                  )}
                />
              </form>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
