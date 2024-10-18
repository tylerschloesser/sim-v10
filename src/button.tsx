import React from 'react'

export type ButtonProps = React.PropsWithChildren<{
  onClick?(): void
  disabled?: boolean
}>

export const Button = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(function Button(
  { children, onClick, disabled = false }: ButtonProps,
  ref,
) {
  return (
    <button
      ref={ref}
      className="border p-2 hover:opacity-75 active:opacity-50 disabled:opacity-25"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
})
