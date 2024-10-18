import * as Dialog from '@radix-ui/react-dialog'
import * as Form from '@radix-ui/react-form'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import clsx from 'clsx'
import { Button } from './button'
import { Input } from './input'

export function RobotDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button>Add Robot</Button>
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
              <Form.Root>
                <Form.Field name="name">
                  <Form.Label>Name</Form.Label>
                  <Form.Control asChild>
                    <Input type="text" required />
                  </Form.Control>
                </Form.Field>
              </Form.Root>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
