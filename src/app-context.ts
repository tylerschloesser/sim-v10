import React from 'react'
import { Updater } from 'use-immer'
import { State } from './state'

export const AppContext = React.createContext<{
  state: State
  setState: Updater<State>
}>(null!)
