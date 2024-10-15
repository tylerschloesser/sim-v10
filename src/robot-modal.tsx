import { RobotModal as IRobotModal } from './app-context'

interface RobotModalProps {
  modal: IRobotModal
}

export function RobotModal({ modal }: RobotModalProps) {
  return (
    <dialog className="fixed" open={modal.open}>
      TODO
      <button>Close</button>
    </dialog>
  )
}
