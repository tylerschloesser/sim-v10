import React from 'react'
import shortId from 'short-uuid'
import { Updater } from 'use-immer'
import {
  ActionType,
  Context,
  ItemType,
  VariableType,
} from './types'

export const AppContext = React.createContext<{
  context: Context
  setContext: Updater<Context>
}>(null!)

const INITIAL_VARIABLES: Context['variables'] = {}

function addItemVariable(item: ItemType): void {
  const id = shortId.generate()
  INITIAL_VARIABLES[id] = {
    id,
    type: VariableType.enum.Item,
    item,
  }
}

addItemVariable(ItemType.enum.Stone)
addItemVariable(ItemType.enum.Wood)

const INITIAL_ACTIONS: Context['actions'] = {}

function addAction(type: ActionType): void {
  const id = shortId.generate()
  INITIAL_ACTIONS[id] = {
    id,
    type,
    condition: null,
    output: null,
  }
}

addAction(ActionType.enum.GatherStone)
addAction(ActionType.enum.GatherWood)

export const INITIAL_CONTEXT: Context = {
  tick: 0,
  drag: null,
  modal: null,
  variables: INITIAL_VARIABLES,
  actions: INITIAL_ACTIONS,
  stores: {},
}
