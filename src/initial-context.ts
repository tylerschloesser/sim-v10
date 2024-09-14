import shortId from 'short-uuid'
import {
  Context,
  ItemLocation,
  ItemType,
  ModalStateType,
  VariableType,
} from './types'

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

export const INITIAL_CONTEXT: Context = {
  tick: 0,
  items: [
    {
      id: shortId.generate(),
      location: ItemLocation.enum.Available,
      type: ItemType.enum.Stone,
      condition: null,
      output: null,
    },
    {
      id: shortId.generate(),
      location: ItemLocation.enum.Available,
      type: ItemType.enum.Wood,
      condition: null,
    },
    {
      id: shortId.generate(),
      location: ItemLocation.enum.Available,
      type: ItemType.enum.ResearchStone,
      condition: null,
      progress: 0,
    },
  ],
  drag: null,
  inventory: {},
  modal: { type: ModalStateType.Initial, open: false },
  variables: INITIAL_VARIABLES,
}
