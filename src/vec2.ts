export class Vec2 {
  readonly x: number
  readonly y: number
  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  mul(scalar: number): Vec2 {
    return new Vec2(this.x * scalar, this.y * scalar)
  }

  add(other: Vec2): Vec2 {
    return new Vec2(this.x + other.x, this.y + other.y)
  }

  sub(other: Vec2): Vec2 {
    return new Vec2(this.x - other.x, this.y - other.y)
  }

  static ZERO = new Vec2(0, 0)
}

export class Rect {
  readonly position: Vec2
  readonly size: Vec2
  constructor(position: Vec2, size: Vec2) {
    this.position = position
    this.size = size
  }

  contains(point: Vec2): boolean {
    return (
      point.x >= this.position.x &&
      point.y >= this.position.y &&
      point.x <= this.position.x + this.size.x &&
      point.y <= this.position.y + this.size.y
    )
  }
}
