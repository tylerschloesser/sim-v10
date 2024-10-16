export type ButtonProps = React.PropsWithChildren<{
  onClick?(): void
  disabled?: boolean
}>

export function Button({
  children,
  onClick,
  disabled = false,
}: ButtonProps) {
  return (
    <button
      className="border p-2 hover:opacity-75 active:opacity-50 disabled:opacity-25"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
