import clsx from 'clsx'
import { clamp } from 'lodash-es'
import { useEffect, useMemo, useRef } from 'react'
import invariant from 'tiny-invariant'
import { Updater, useImmer } from 'use-immer'
import { Rect, Vec2 } from './vec2'

const MIN_SCALE = 0.5
const MAX_SCALE = 1.5

enum DragType {
  Entity = 'entity',
  Camera = 'camera',
}

interface EntityDrag {
  type: DragType.Entity
  index: number
  start: Vec2
  offset: Vec2
}

interface CameraDrag {
  type: DragType.Camera
  start: Vec2
}

type Drag = EntityDrag | CameraDrag

interface CanvasState {
  rect: Rect | null
  pointer: {
    position: Vec2
    down: boolean
  } | null
  entities: Rect[]
  drag: Drag | null
  camera: {
    position: Vec2
    zoom: number
  }
}

export function AppCanvas() {
  const ref = useRef<HTMLDivElement>(null)

  const [state, setState] = useImmer<CanvasState>({
    rect: null,
    pointer: null,
    entities: [
      new Rect(new Vec2(0, 0), new Vec2(100, 100)),
      new Rect(new Vec2(-100, -100), new Vec2(100, 100)),
    ],
    drag: null,
    camera: {
      position: Vec2.ZERO,
      zoom: 0.5,
    },
  })

  const scale = useMemo(() => {
    invariant(state.camera.zoom >= 0)
    invariant(state.camera.zoom <= 1)
    return (
      MIN_SCALE +
      (MAX_SCALE - MIN_SCALE) * state.camera.zoom
    )
  }, [state.camera.zoom])

  useEvents(setState, ref)

  useEffect(() => {
    invariant(ref.current)
    const rect = ref.current.getBoundingClientRect()
    setState((draft) => {
      draft.rect = new Rect(
        new Vec2(rect.x, rect.y),
        new Vec2(rect.width, rect.height),
      )
    })
  }, [])

  const rect = useMemo(() => state.rect, [state.rect])

  const camera = useMemo(() => {
    if (
      state.drag?.type !== DragType.Camera ||
      !rect?.position ||
      !state.pointer
    ) {
      return state.camera.position
    }
    return state.pointer.position
      .sub(rect.position)
      .sub(rect.size.div(2))
      .sub(state.drag.start)
  }, [
    state.drag,
    state.camera.position,
    rect?.position,
    state.pointer,
  ])

  const translate = useMemo(() => {
    return camera
      .mul(scale)
      .add((rect?.size ?? Vec2.ZERO).div(2))
  }, [camera, rect?.size, scale])

  const pointer = useMemo(() => {
    if (!rect?.position || !state.pointer) {
      return null
    }
    return state.pointer.position
      .sub(rect.position)
      .sub(translate)
  }, [rect?.position, state.pointer, translate])

  const active = useMemo(() => {
    if (!rect || !state.pointer) {
      return false
    }
    return rect.contains(state.pointer.position)
  }, [rect, state.pointer])

  const entities = useMemo(() => {
    return state.entities.map((entity, index) => {
      let hover = pointer ? entity.contains(pointer) : false
      let position = entity.position.mul(scale)
      const size = entity.size.mul(scale)
      if (
        state.drag?.type === DragType.Entity &&
        state.drag.index === index
      ) {
        invariant(pointer)
        position = pointer.sub(
          state.drag.offset.map(
            (offset) =>
              new Vec2(
                offset.x * entity.size.x,
                offset.y * entity.size.y,
              ),
          ),
        )
        hover = true
      }
      return { hover, position, size }
    })
  }, [state.entities, state.drag, pointer, scale])

  const connection = useMemo<{
    rect: Rect
    corner:
      | 'top-left'
      | 'top-right'
      | 'bottom-left'
      | 'bottom-right'
  }>(() => {
    invariant(entities.length === 2)
    const [a, b] = entities
    invariant(a && b)

    const aCenter = a.position.add(a.size.mul(0.5))
    const bCenter = b.position.add(b.size.mul(0.5))

    const rect = new Rect(
      new Vec2(
        Math.min(aCenter.x, bCenter.x),
        Math.min(aCenter.y, bCenter.y),
      ),
      new Vec2(
        Math.abs(aCenter.x - bCenter.x),
        Math.abs(aCenter.y - bCenter.y),
      ),
    )

    const corner = (() => {
      if (aCenter.x < bCenter.x) {
        if (aCenter.y < bCenter.y) {
          return 'top-left'
        }
        return 'bottom-left'
      }
      if (aCenter.y < bCenter.y) {
        return 'top-right'
      }
      return 'bottom-right'
    })()

    return { rect, corner }
  }, [entities])

  return (
    <div
      ref={ref}
      className="relative border border-white h-dvh select-none"
    >
      <pre className="absolute top-0 left-0 text-xs pointer-events-none">
        {JSON.stringify(state, null, 2)}
      </pre>
      {state && (
        <>
          <div
            className="absolute"
            style={{
              transform: `translate(${translate.x}px, ${translate.y}px)`,
            }}
          >
            {pointer && (
              <div
                className={clsx(
                  'absolute pointer-events-none border border-green-400',
                  !active && 'opacity-50',
                )}
                style={{
                  transform: `translate(${pointer.x}px, ${pointer.y}px)`,
                }}
              >
                TODO
              </div>
            )}
            <div
              className={clsx(
                'absolute border-white pointer-events-none',
                connection.corner === 'top-left' &&
                  'border-b-2 border-l-2',
                connection.corner === 'top-right' &&
                  'border-b-2 border-r-2',
                connection.corner === 'bottom-left' &&
                  'border-t-2 border-l-2',
                connection.corner === 'bottom-right' &&
                  'border-t-2 border-r-2',
              )}
              style={{
                transform: `translate(${connection.rect.position.x}px, ${connection.rect.position.y}px)`,
                width: connection.rect.size.x,
                height: connection.rect.size.y,
              }}
            />
            {entities.map((entity, index) => (
              <div
                key={index}
                className={clsx(
                  'absolute border-2 border-white',
                  entity.hover && 'border-blue-400',
                )}
                style={{
                  transform: `translate(${entity.position.x}px, ${entity.position.y}px)`,
                  width: entity.size.x,
                  height: entity.size.y,
                }}
              >
                <button
                  className="text-blue-300"
                  onClick={() => {
                    console.log('Test')
                  }}
                >
                  Edit
                </button>
                <label>
                  Test
                  <input type="text" />
                </label>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function useEvents(
  setState: Updater<CanvasState>,
  ref: React.RefObject<HTMLDivElement>,
) {
  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    document.addEventListener(
      'pointermove',
      (e) => {
        setState((draft) => {
          draft.pointer = {
            position: new Vec2(e.clientX, e.clientY),
            down: draft.pointer?.down ?? false,
          }
          if (
            !draft.rect ||
            !draft.pointer.down ||
            draft.drag !== null
          ) {
            return
          }
          const pointer = draft.pointer.position
            .sub(draft.rect.position)
            .sub(draft.camera.position)
            .sub(draft.rect.size.div(2))
          const index = draft.entities.findIndex((entity) =>
            entity.contains(pointer),
          )
          if (index === -1) {
            draft.drag = {
              type: DragType.Camera,
              start: pointer,
            }
          } else {
            const entity = draft.entities[index]
            invariant(entity)
            draft.drag = {
              type: DragType.Entity,
              index,
              start: pointer,
              offset: pointer
                .sub(entity.position)
                .map(
                  ({ x, y }) =>
                    new Vec2(
                      x / entity.size.x,
                      y / entity.size.y,
                    ),
                ),
            }
            invariant(draft.drag.offset.x >= 0)
            invariant(draft.drag.offset.y >= 0)
            invariant(draft.drag.offset.x <= 1)
            invariant(draft.drag.offset.y <= 1)
          }
        })
      },
      { signal },
    )

    document.addEventListener(
      'pointerdown',
      (e) => {
        setState((draft) => {
          const position = new Vec2(e.clientX, e.clientY)
          const down =
            draft.rect?.contains(position) ?? false
          draft.pointer = { position, down }
        })
      },
      { signal },
    )

    document.addEventListener(
      'pointerup',
      (e) => {
        setState((draft) => {
          draft.pointer = {
            position: new Vec2(e.clientX, e.clientY),
            down: false,
          }
          if (!draft.rect) {
            return
          }
          const pointer = draft.pointer.position
            .sub(draft.rect.position)
            .sub(draft.camera.position)
            .sub(draft.rect.size.div(2))
          switch (draft.drag?.type) {
            case DragType.Entity: {
              const entity =
                draft.entities[draft.drag.index]
              invariant(entity)
              entity.position = pointer.sub(
                draft.drag.offset.map(
                  (offset) =>
                    new Vec2(
                      offset.x * entity.size.x,
                      offset.y * entity.size.y,
                    ),
                ),
              )
              draft.drag = null
              break
            }
            case DragType.Camera: {
              draft.camera.position =
                draft.camera.position.add(
                  pointer.sub(draft.drag.start),
                )
              draft.drag = null
              break
            }
          }
        })
      },
      { signal },
    )

    // prettier-ignore
    document.addEventListener('pointerleave', () => {
      setState(draft => {
        draft.pointer = null
        draft.drag = null
      })
    }, { signal })

    // prettier-ignore
    document.addEventListener('scroll', () => {
      invariant(ref.current)
      const rect = ref.current.getBoundingClientRect()
      setState(draft => {
        draft.rect = new Rect(
          new Vec2(rect.x, rect.y),
          new Vec2(rect.width, rect.height),
        )
      }) 
    }, { signal })

    document.addEventListener(
      'wheel',
      (ev) => {
        if (!ev.ctrlKey) {
          return
        }
        ev.preventDefault()
        setState((draft) => {
          draft.camera.zoom = clamp(
            draft.camera.zoom - ev.deltaY * 0.003,
            0,
            1,
          )
        })
      },
      {
        signal,
        passive: false,
      },
    )

    document.addEventListener(
      'keydown',
      (ev) => {
        if (ev.key === 'Escape') {
          setState((draft) => {
            draft.drag = null
            if (draft.pointer) {
              draft.pointer.down = false
            }
          })
        }
      },
      { signal },
    )

    return () => {
      controller.abort()
    }
  }, [])
}
