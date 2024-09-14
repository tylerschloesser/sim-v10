import { PropsWithChildren, useEffect, useRef } from 'react'
import invariant from 'tiny-invariant'

export type ModalProps = PropsWithChildren<{
  title: string
  open: boolean
  onClose: () => void
}>

export function Modal({
  title,
  open,
  onClose,
  children,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (open) {
      ref.current?.showModal()
    } else {
      ref.current?.close()
    }
  }, [open])

  useEffect(() => {
    invariant(ref.current)
    ref.current.addEventListener('close', onClose)
  }, [])
  return (
    <dialog
      ref={ref}
      className="backdrop:bg-slate-400 backdrop:bg-opacity-30"
    >
      <form
        method="dialog"
        className="bg-gray-200 flex flex-col"
      >
        <div className="border-b border-black p-4 gap-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            className="border border-black p-2 hover:opacity-75 active:opacity-50"
            onClick={() => {
              ref.current?.close()
            }}
          >
            Close
          </button>
        </div>
        <div className="p-4">{children}</div>
      </form>
    </dialog>
  )
}
