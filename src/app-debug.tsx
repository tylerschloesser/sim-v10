import clsx from 'clsx'
import { useContext, useEffect, useState } from 'react'
import { AppContext } from './context'

export function AppDebug() {
  const { context } = useContext(AppContext)
  const scrollDebug = useScrollDebug()
  return (
    <div
      className={clsx(
        'fixed top-0 bottom-0 left-0 p-2 font-mono whitespace-pre opacity-25 text-sm overflow-scroll',
        !scrollDebug && 'pointer-events-none',
      )}
    >
      {JSON.stringify(context, null, 2)}
    </div>
  )
}

function useScrollDebug() {
  const [scrollDebug, setScrollDebug] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    // prettier-ignore
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'd') {
        setScrollDebug(true)
      }
    }, { signal, })

    // prettier-ignore
    document.addEventListener('keyup', (ev) => {
      if (ev.key === 'd') {
        setScrollDebug(false)
      }
    }, { signal, })
  }, [])

  return scrollDebug
}
