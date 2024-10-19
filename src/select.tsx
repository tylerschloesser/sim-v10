import { ChevronDownIcon } from '@radix-ui/react-icons'
import {
  Content,
  Icon,
  Item,
  ItemIndicator,
  ItemText,
  Portal,
  Root,
  Trigger,
  Value,
  Viewport,
} from '@radix-ui/react-select'

interface SelectProps<T extends string> {
  required?: boolean
  id: string
  name: string
  value: T
  onChange(value: T): void
  parse(value: string): T
  options: T[]
}

export function Select<T extends string>({
  required,
  id,
  name,
  value,
  onChange,
  parse,
  options,
}: SelectProps<T>) {
  return (
    <Root
      required={required}
      name={name}
      value={value}
      onValueChange={(item) => {
        onChange(parse(item))
      }}
    >
      <Trigger
        id={id}
        className="bg-white text-black border p-2 flex items-center justify-between gap-2"
      >
        <Value />
        <Icon>
          <ChevronDownIcon />
        </Icon>
      </Trigger>
      <Portal>
        <Content className="p-2 bg-white text-black">
          <Viewport className="p-2">
            {options.map((option) => (
              <Item
                key={option}
                value={option}
                className="p-2 data-[highlighted]:bg-gray-200 select-none"
              >
                <ItemText>{option}</ItemText>
                <ItemIndicator className="bg-gray-200" />
              </Item>
            ))}
          </Viewport>
        </Content>
      </Portal>
    </Root>
  )
}
