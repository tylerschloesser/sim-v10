import { useContext } from 'react'
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
  return (
    <dialog
      className="fixed top-0 left-0 right-0 bottom-0"
      open={modal.open}
    >
      TODO
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
