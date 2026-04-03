import * as Select from '@radix-ui/react-select'
import { CheckIcon, ChevronDownIcon } from '@radix-ui/react-icons'
import type { FormSelectProps } from '../types'

export function FormSelect({ value, onChange, placeholder, options }: FormSelectProps) {
  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-gray-500">
        <Select.Value placeholder={placeholder} />
        <Select.Icon>
          <ChevronDownIcon className="h-4 w-4" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content className="z-50 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
          <Select.Viewport className="p-1">
            {options.map(function (opt) {
              return (
                <Select.Item
                  key={opt}
                  value={opt}
                  className="relative flex cursor-pointer select-none items-center rounded px-8 py-2 text-sm text-gray-900 outline-none data-[highlighted]:bg-gray-100"
                >
                  <Select.ItemText>{opt}</Select.ItemText>
                  <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                    <CheckIcon className="h-4 w-4" />
                  </Select.ItemIndicator>
                </Select.Item>
              )
            })}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}
