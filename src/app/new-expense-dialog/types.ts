import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import type { ExpenseFormValues } from './schema'

export interface NewExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: ExpenseFormValues) => void
  employees?: string[]
}

export interface FieldErrorProps {
  message?: string
}

export interface FormSelectProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  options: readonly string[] | string[]
}

export interface SplitRowProps {
  index: number
  register: UseFormRegister<ExpenseFormValues>
  errors: FieldErrors<ExpenseFormValues>
  onRemove: (index: number) => void
}

export interface SplitTotalPillProps {
  splitTotal: number
  totalAmount: number
  balanced: boolean
}

export interface DialogFooterProps {
  canSubmit: boolean
  onCancel: () => void
}
