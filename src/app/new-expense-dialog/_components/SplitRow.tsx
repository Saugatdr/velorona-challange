import { TrashIcon } from '@radix-ui/react-icons'
import { FieldError } from './FieldError'
import type { SplitRowProps } from '../types'

export function SplitRow({ index, register, errors, onRemove }: SplitRowProps) {
  const labelError = errors.splits?.[index]?.label?.message
  const amountError = errors.splits?.[index]?.amount?.message

  return (
    <div className="grid grid-cols-12 gap-3 rounded-lg border border-gray-200 p-3">
      <div className="col-span-7">
        <input
          {...register(`splits.${index}.label`)}
          type="text"
          placeholder="Split label"
          className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none transition focus:border-gray-500"
        />
        <FieldError message={typeof labelError === 'string' ? labelError : undefined} />
      </div>

      <div className="col-span-4">
        <input
          {...register(`splits.${index}.amount`, { valueAsNumber: true })}
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none transition focus:border-gray-500"
        />
        <FieldError message={typeof amountError === 'string' ? amountError : undefined} />
      </div>

      <div className="col-span-1 flex items-start justify-end">
        <button
          type="button"
          onClick={function () {
            onRemove(index)
          }}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 text-gray-600 transition hover:bg-gray-50"
          aria-label={`Remove split ${index + 1}`}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
