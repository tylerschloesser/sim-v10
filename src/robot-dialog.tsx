import * as Dialog from '@radix-ui/react-dialog'
import { ChevronDownIcon } from '@radix-ui/react-icons'
import * as Select from '@radix-ui/react-select'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import clsx from 'clsx'
import { omit } from 'lodash-es'
import React, {
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react'
import invariant from 'tiny-invariant'
import { z } from 'zod'
import { AppContext } from './app-context'
import { Button } from './button'
import { Input } from './input'
import { InventoryApi } from './inventory-api'
import { ActionType, ItemType, Robot } from './state'

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

  const defaultValues = useMemo<
    Omit<Robot, 'action'>
  >(() => {
    const robot = state.robots[id]
    if (robot) {
      return omit(robot, 'action')
    }
    return {
      id,
      name: '',
      algorithm: [
        {
          action: {
            type: ActionType.enum.Mine,
            item: ItemType.enum.Stone,
            count: 10,
            progress: 0,
          },
        },
      ],
    }
  }, [id, state.robots])

  const form = useForm({
    validatorAdapter: zodValidator(),
    validators: {
      onChange: Robot.omit({ action: true }),
    },
    defaultValues,
    onSubmit: async ({ value }) => {
      setState((draft) => {
        const inventory = new InventoryApi(draft.inventory)
        if (value.id === `${draft.nextRobotId}`) {
          invariant(!draft.robots[value.id])
          draft.nextRobotId++
          inventory.dec(ItemType.enum.Robot)
        }
        const action =
          draft.robots[value.id]?.action ?? null
        draft.robots[value.id] = { ...value, action }
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
            <div className="border p-4 flex flex-col gap-4 pointer-events-auto">
              <Dialog.Title className="text-xl">
                Add Robot
              </Dialog.Title>
              <VisuallyHidden asChild>
                <Dialog.Description>
                  TODO
                </Dialog.Description>
              </VisuallyHidden>
              <form
                onSubmit={onSubmit}
                className="flex flex-col gap-4"
              >
                <div className="grid grid-cols-[min-content_1fr] gap-2 items-center">
                  <form.Field
                    name="id"
                    children={(field) => (
                      <FormField label="ID">
                        {({ id }) => (
                          <Input
                            type="text"
                            disabled
                            id={id}
                            name={field.name}
                            value={field.state.value}
                          />
                        )}
                      </FormField>
                    )}
                  />

                  <form.Field
                    name="name"
                    children={(field) => (
                      <FormField label="Name">
                        {({ id }) => (
                          <Input
                            type="text"
                            required
                            id={id}
                            name={field.name}
                            autoComplete="off"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) =>
                              field.handleChange(
                                e.target.value,
                              )
                            }
                          />
                        )}
                      </FormField>
                    )}
                  />

                  <form.Field
                    name="algorithm"
                    mode="array"
                    children={(field) =>
                      field.state.value.map((step, i) => (
                        <form.Field
                          key={i}
                          name={`algorithm[${i}].action`}
                          children={(subField) => (
                            <FormField
                              label={`Step ${i + 1}`}
                              key={i}
                            >
                              {({ id }) => (
                                <Select.Root
                                  required
                                  name={field.name}
                                  value={step.action.item}
                                  onValueChange={(item) => {
                                    subField.handleChange({
                                      type: ActionType.enum
                                        .Mine,
                                      item: z
                                        .union([
                                          z.literal(
                                            ItemType.enum
                                              .Coal,
                                          ),
                                          z.literal(
                                            ItemType.enum
                                              .Stone,
                                          ),
                                        ])
                                        .parse(item),
                                      count: 10,
                                      progress: 0,
                                    })
                                  }}
                                >
                                  <Select.Trigger
                                    id={id}
                                    className="bg-white text-black border p-2 flex items-center justify-between gap-2"
                                  >
                                    <Select.Value />
                                    <Select.Icon>
                                      <ChevronDownIcon />
                                    </Select.Icon>
                                  </Select.Trigger>
                                  <Select.Portal>
                                    <Select.Content className="p-2 bg-white text-black">
                                      <Select.Viewport className="p-2">
                                        {[
                                          ItemType.enum
                                            .Coal,
                                          ItemType.enum
                                            .Stone,
                                        ].map((item) => (
                                          <Select.Item
                                            key={item}
                                            value={item}
                                            className="p-2 data-[highlighted]:bg-gray-200 select-none"
                                          >
                                            <Select.ItemText>
                                              {item}
                                            </Select.ItemText>
                                            <Select.ItemIndicator className="bg-gray-200" />
                                          </Select.Item>
                                        ))}
                                      </Select.Viewport>
                                    </Select.Content>
                                  </Select.Portal>
                                </Select.Root>
                              )}
                            </FormField>
                          )}
                        />
                      ))
                    }
                  />
                </div>

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

function FormField({
  label,
  children,
}: {
  label: string
  children: (args: { id: string }) => React.ReactNode
}) {
  const id = useId()
  return (
    <>
      <label htmlFor={id}>{label}</label>
      {children({ id })}
    </>
  )
}
