import React from 'react'

type InputProps = React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>

export const Input = React.forwardRef<
  HTMLInputElement,
  InputProps
>(function Input(props, ref) {
  return <input {...props} ref={ref} />
})
