import type { SplitTotalPillProps } from '../types'

export function SplitTotalPill({ splitTotal, totalAmount, balanced }: SplitTotalPillProps) {
  return (
    <div
      className={[
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium',
        balanced ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
      ].join(' ')}
    >
      <span>
        Split Total: ${splitTotal.toFixed(2)} / ${Number(totalAmount).toFixed(2)}
      </span>
      <span aria-hidden="true">{balanced ? '✅' : '❌'}</span>
    </div>
  )
}
