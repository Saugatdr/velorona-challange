import type { DialogFooterProps } from '../types'

export function DialogFooter({ canSubmit, onCancel }: DialogFooterProps) {
  return (
    <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex h-10 items-center rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={!canSubmit}
        className="inline-flex h-10 items-center rounded-md bg-black px-4 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Submit
      </button>
    </div>
  )
}
