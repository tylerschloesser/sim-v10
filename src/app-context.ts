import React from 'react'
import { Updater } from 'use-immer'
import { ReadOnlyInventoryApi } from './inventory-api'
import { State } from './state'

export interface RobotModal {
  open: boolean
}

export type Modal = RobotModal

export const AppContext = React.createContext<{
  state: State
  setState: Updater<State>
  inventory: ReadOnlyInventoryApi
  modal: Modal | null
  setModal: Updater<Modal | null>
}>(null!)
