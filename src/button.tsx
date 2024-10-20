import React from 'react'

export type ButtonProps = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>

export const Button = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(function Button({ ...props }: ButtonProps, ref) {
  return (
    <button
      ref={ref}
      className="border p-2 hover:opacity-75 active:opacity-50 disabled:opacity-25"
      {...props}
    />
  )
})
