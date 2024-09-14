import { useEffect, useState } from 'react'
import { Updater } from 'use-immer'
import { tickContext } from './tick-context'
import { Context } from './types'

const TICK_INTERVAL: number = 1000
const FAST_TICK_INTERVAL: number = TICK_INTERVAL * 0.01

export function useTickInterval(
  setContext: Updater<Context>,
) {
  const [fast, setFast] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    // prettier-ignore
    document.addEventListener('keydown', (ev) => {
      if (ev.key === ' ') {
        ev.preventDefault()
        setFast(true)
      }
    }, { signal })

    // prettier-ignore
    document.addEventListener('keyup', (ev) => {
      if (ev.key === ' ') {
        ev.preventDefault()
        setFast(false)
      }
    }, { signal })

    return () => {
      controller.abort()
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(
      () => {
        setContext(tickContext)
      },
      fast ? FAST_TICK_INTERVAL : TICK_INTERVAL,
    )
    return () => {
      clearInterval(interval)
    }
  }, [fast])
}
