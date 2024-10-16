import { useContext, useEffect, useRef } from 'react'
import invariant from 'tiny-invariant'
import {
  AppContext,
  RobotModal as IRobotModal,
} from './app-context'
import { Button } from './button'

interface RobotModalProps {
  modal: IRobotModal
}

export function RobotModal({ modal }: RobotModalProps) {
  const { setModal } = useContext(AppContext)
  const ref = useRef<HTMLDialogElement | null>(null)
  useEffect(() => {
    invariant(ref.current)
    if (modal.open) {
      ref.current.showModal()
    } else {
      ref.current.close()
    }
  }, [modal.open])
  return (
    <dialog
      ref={ref}
      className="fixed top-0 left-0 right-0 bottom-0 p-2 backdrop:backdrop-blur-sm"
    >
      <label className="flex flex-col">
        Name
        <input className="border border-black p-2" />
      </label>
      <Button
        onClick={() => {
          setModal((draft) => {
            invariant(draft)
            draft.open = false
          })
        }}
      >
        Close
      </Button>
    </dialog>
  )
}
