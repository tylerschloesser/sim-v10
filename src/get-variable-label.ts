import {
  ItemVariable,
  PartialCustomVariable,
  VariableType,
} from './types'

export function getVariableLabel(
  variable: ItemVariable | PartialCustomVariable,
): string {
  switch (variable.type) {
    case VariableType.enum.Item:
      return variable.item
    case VariableType.enum.Custom:
      return variable.name || variable.id
  }
}
