import * as Dialog from '@radix-ui/react-dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { FieldApi, useForm } from '@tanstack/react-form'
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
import { AppContext } from './app-context'
import { Button } from './button'
import { Input } from './input'
import { InventoryApi } from './inventory-api'
import { Select } from './select'
import {
  ActionType,
  CraftActionItemType,
  ItemType,
  MineActionItemType,
  Operator,
  Robot,
  SmeltActionItemType,
} from './state'

type RobotDialogProps = {
  robotId?: string
  trigger: React.ReactNode
}

export function RobotDialog(props: RobotDialogProps) {
  const [open, setOpen] = useState(false)

  const { state, setState } = useContext(AppContext)

  const title = useMemo(
    () => (props.robotId ? 'Edit Robot' : 'Add Robot'),
    [props.robotId],
  )

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
      algorithm: [],
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
        <Dialog.Overlay className="fixed inset-0 backdrop-blur data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out">
          <Dialog.Content
            className={clsx(
              'data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out',
            )}
          >
            <div
              className={clsx(
                'max-h-dvh overflow-y-auto',
                'fixed p-2 inset-0 flex [align-items:safe_center] [justify-content:safe_center]',
              )}
            >
              <div className="border p-4 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <Dialog.Title className="text-xl">
                    {title}
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="underline"
                    >
                      Close
                    </button>
                  </Dialog.Close>
                </div>
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
                  </div>
                  <form.Field
                    name="algorithm"
                    mode="array"
                    children={(field) => (
                      <div className="flex flex-col gap-4">
                        {field.state.value.map(
                          (_step, i) => (
                            <div
                              key={i}
                              className="flex gap-2 items-end"
                            >
                              <div className="grid grid-cols-[min-content_1fr] items-center gap-2">
                                <form.Field
                                  name={`algorithm[${i}].action`}
                                  children={(subField) => (
                                    <>
                                      <FormField
                                        label="Type"
                                        key={i}
                                      >
                                        {({ id }) => (
                                          <Select
                                            required
                                            id={id}
                                            name={
                                              subField.name
                                            }
                                            value={
                                              subField.state
                                                .value.type
                                            }
                                            onChange={(
                                              type,
                                            ) => {
                                              switch (
                                                type
                                              ) {
                                                case ActionType
                                                  .enum
                                                  .Mine: {
                                                  subField.handleChange(
                                                    {
                                                      type,
                                                      item: ItemType
                                                        .enum
                                                        .Coal,
                                                      count: 10,
                                                      progress: 0,
                                                    },
                                                  )
                                                  break
                                                }
                                                case ActionType
                                                  .enum
                                                  .Smelt: {
                                                  subField.handleChange(
                                                    {
                                                      type,
                                                      item: ItemType
                                                        .enum
                                                        .IronPlate,
                                                      count: 1,
                                                      progress: 0,
                                                    },
                                                  )
                                                  break
                                                }
                                                case ActionType
                                                  .enum
                                                  .Craft: {
                                                  subField.handleChange(
                                                    {
                                                      type,
                                                      item: ItemType
                                                        .enum
                                                        .ElectronicCircuit,
                                                      count: 1,
                                                      progress: 0,
                                                    },
                                                  )
                                                  break
                                                }
                                                default: {
                                                  invariant(
                                                    false,
                                                    'TODO',
                                                  )
                                                }
                                              }
                                            }}
                                            options={Object.values(
                                              ActionType.Values,
                                            )}
                                            parse={
                                              ActionType.parse
                                            }
                                          />
                                        )}
                                      </FormField>
                                      {subField.state.value
                                        .type ===
                                        ActionType.enum
                                          .Mine && (
                                        <>
                                          <form.Field
                                            name={`algorithm[${i}].action.item`}
                                            children={(
                                              subSubField,
                                            ) => (
                                              <FormField label="Item">
                                                {({
                                                  id,
                                                }) => (
                                                  <Select
                                                    id={id}
                                                    name={
                                                      subSubField.name
                                                    }
                                                    value={
                                                      subSubField
                                                        .state
                                                        .value
                                                    }
                                                    onChange={(
                                                      item,
                                                    ) =>
                                                      subSubField.handleChange(
                                                        item,
                                                      )
                                                    }
                                                    options={Object.values(
                                                      MineActionItemType.Values,
                                                    )}
                                                    parse={
                                                      MineActionItemType.parse
                                                    }
                                                  />
                                                )}
                                              </FormField>
                                            )}
                                          />
                                          <form.Field
                                            name={`algorithm[${i}].action.count`}
                                            children={(
                                              subSubField,
                                            ) => (
                                              <FormField label="Count">
                                                {({
                                                  id,
                                                }) => (
                                                  <Input
                                                    type="number"
                                                    id={id}
                                                    name={
                                                      subSubField.name
                                                    }
                                                    value={
                                                      subSubField
                                                        .state
                                                        .value
                                                    }
                                                    onChange={(
                                                      e,
                                                    ) =>
                                                      subSubField.handleChange(
                                                        parseInt(
                                                          e
                                                            .target
                                                            .value,
                                                        ),
                                                      )
                                                    }
                                                  />
                                                )}
                                              </FormField>
                                            )}
                                          />
                                        </>
                                      )}
                                      {subField.state.value
                                        .type ===
                                        ActionType.enum
                                          .Smelt && (
                                        <>
                                          <form.Field
                                            name={`algorithm[${i}].action.item`}
                                            children={(
                                              subSubField,
                                            ) => (
                                              <FormField label="Item">
                                                {({
                                                  id,
                                                }) => (
                                                  <Select
                                                    id={id}
                                                    name={
                                                      subSubField.name
                                                    }
                                                    value={
                                                      subSubField
                                                        .state
                                                        .value
                                                    }
                                                    onChange={(
                                                      item,
                                                    ) =>
                                                      subSubField.handleChange(
                                                        item,
                                                      )
                                                    }
                                                    options={Object.values(
                                                      SmeltActionItemType.Values,
                                                    )}
                                                    parse={
                                                      SmeltActionItemType.parse
                                                    }
                                                  />
                                                )}
                                              </FormField>
                                            )}
                                          />
                                          <form.Field
                                            name={`algorithm[${i}].action.count`}
                                            children={(
                                              subSubField,
                                            ) => (
                                              <FormField label="Count">
                                                {({
                                                  id,
                                                }) => (
                                                  <Input
                                                    type="number"
                                                    id={id}
                                                    name={
                                                      subSubField.name
                                                    }
                                                    value={
                                                      subSubField
                                                        .state
                                                        .value
                                                    }
                                                    onChange={(
                                                      e,
                                                    ) =>
                                                      subSubField.handleChange(
                                                        parseInt(
                                                          e
                                                            .target
                                                            .value,
                                                        ),
                                                      )
                                                    }
                                                  />
                                                )}
                                              </FormField>
                                            )}
                                          />
                                        </>
                                      )}
                                      {subField.state.value
                                        .type ===
                                        ActionType.enum
                                          .Craft && (
                                        <>
                                          <form.Field
                                            name={`algorithm[${i}].action.item`}
                                            children={(
                                              subSubField,
                                            ) => (
                                              <FormField label="Item">
                                                {({
                                                  id,
                                                }) => (
                                                  <Select
                                                    id={id}
                                                    name={
                                                      subSubField.name
                                                    }
                                                    value={
                                                      subSubField
                                                        .state
                                                        .value
                                                    }
                                                    onChange={(
                                                      item,
                                                    ) =>
                                                      subSubField.handleChange(
                                                        item,
                                                      )
                                                    }
                                                    options={Object.values(
                                                      CraftActionItemType.Values,
                                                    )}
                                                    parse={
                                                      CraftActionItemType.parse
                                                    }
                                                  />
                                                )}
                                              </FormField>
                                            )}
                                          />
                                          <form.Field
                                            name={`algorithm[${i}].action.count`}
                                            children={(
                                              subSubField,
                                            ) => (
                                              <FormField label="Count">
                                                {({
                                                  id,
                                                }) => (
                                                  <Input
                                                    type="number"
                                                    id={id}
                                                    name={
                                                      subSubField.name
                                                    }
                                                    value={
                                                      subSubField
                                                        .state
                                                        .value
                                                    }
                                                    onChange={(
                                                      e,
                                                    ) =>
                                                      subSubField.handleChange(
                                                        parseInt(
                                                          e
                                                            .target
                                                            .value,
                                                        ),
                                                      )
                                                    }
                                                  />
                                                )}
                                              </FormField>
                                            )}
                                          />
                                        </>
                                      )}
                                    </>
                                  )}
                                />
                                <form.Field
                                  name={`algorithm[${i}].condition.left`}
                                  children={(subField) => (
                                    <FormField label="Left">
                                      {({ id }) => (
                                        <Input
                                          type="text"
                                          id={id}
                                          name={
                                            subField.name
                                          }
                                          value={
                                            subField.state
                                              .value ?? ''
                                          }
                                          onChange={(e) =>
                                            subField.handleChange(
                                              e.target
                                                .value,
                                            )
                                          }
                                        />
                                      )}
                                    </FormField>
                                  )}
                                />
                                <form.Field
                                  name={`algorithm[${i}].condition.operator`}
                                  children={(subField) => (
                                    <FormField label="Operator">
                                      {({ id }) => (
                                        <Select
                                          id={id}
                                          name={
                                            subField.name
                                          }
                                          value={
                                            subField.state
                                              .value ?? ''
                                          }
                                          onChange={(op) =>
                                            subField.handleChange(
                                              op,
                                            )
                                          }
                                          options={Object.values(
                                            Operator.Values,
                                          )}
                                          parse={
                                            Operator.parse
                                          }
                                        />
                                      )}
                                    </FormField>
                                  )}
                                />
                                <form.Field
                                  name={`algorithm[${i}].condition.right`}
                                  children={(subField) => (
                                    <FormField label="Right">
                                      {({ id }) => (
                                        <Input
                                          type="text"
                                          id={id}
                                          name={
                                            subField.name
                                          }
                                          value={
                                            subField.state
                                              .value ?? ''
                                          }
                                          onChange={(e) =>
                                            subField.handleChange(
                                              e.target
                                                .value,
                                            )
                                          }
                                        />
                                      )}
                                    </FormField>
                                  )}
                                />
                              </div>
                              <div>
                                <Button
                                  type="button"
                                  onClick={(ev) => {
                                    ev.preventDefault()
                                    field.handleChange(
                                      (value) => {
                                        const next = [
                                          ...value,
                                        ]
                                        next.splice(i, 1)
                                        return next
                                      },
                                    )
                                  }}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ),
                        )}
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            onClick={(ev) => {
                              ev.preventDefault()
                              field.pushValue({
                                action: {
                                  type: ActionType.enum
                                    .Mine,
                                  item: MineActionItemType
                                    .enum.IronOre,
                                  count: 10,
                                  progress: 0,
                                },
                                condition: {
                                  left: '',
                                  operator:
                                    Operator.enum.eq,
                                  right: '',
                                },
                              })
                            }}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
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
        </Dialog.Overlay>
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
