import invariant from 'tiny-invariant'
import { Inventory, ItemType } from './state'

export class ReadOnlyInventoryApi {
  inventory: Inventory
  constructor(inventory: Inventory) {
    this.inventory = inventory
  }

  public get(item: ItemType): number {
    return this.inventory[item] ?? 0
  }

  public has(item: ItemType): boolean {
    return this.get(item) > 0
  }

  hasRecipe(
    recipe: Partial<Record<ItemType, number>>,
  ): boolean {
    return Object.entries(recipe).every(
      ([key, count]) =>
        this.get(ItemType.parse(key)) >= count,
    )
  }

  map<T>(fn: (item: ItemType, count: number) => T) {
    return Object.entries(this.inventory).map(
      ([key, count]) => fn(ItemType.parse(key), count),
    )
  }
}

export class InventoryApi extends ReadOnlyInventoryApi {
  public add(item: ItemType, count: number) {
    invariant(count > 0)
    invariant(Number.isInteger(count))

    this.inventory[item] =
      (this.inventory[item] ?? 0) + count

    invariant(this.inventory[item] > 0)
  }

  public sub(item: ItemType, count: number) {
    invariant(count > 0)
    invariant(Number.isInteger(count))

    invariant(this.inventory[item])
    this.inventory[item] -= count

    if (this.inventory[item] === 0) {
      delete this.inventory[item]
    } else {
      invariant(this.inventory[item] > 0)
    }
  }

  public subRecipe(
    recipe: Partial<Record<ItemType, number>>,
  ) {
    for (const [key, count] of Object.entries(recipe)) {
      this.sub(key as ItemType, count)
    }
  }

  public inc(item: ItemType) {
    this.add(item, 1)
  }

  public dec(item: ItemType) {
    this.sub(item, 1)
  }
}
