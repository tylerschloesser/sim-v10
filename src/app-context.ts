import React from 'react'
import { Updater } from 'use-immer'
import { State } from './state'

export interface RobotModal {
  open: boolean
}

export type Modal = RobotModal

export const AppContext = React.createContext<{
  state: State
  setState: Updater<State>
  modal: Modal | null
  setModal: Updater<Modal | null>
}>(null!)
