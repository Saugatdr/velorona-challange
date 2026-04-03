'use client'

import * as Dialog from '@radix-ui/react-dialog'
import * as Select from '@radix-ui/react-select'
import {
  Cross2Icon,
  ChevronDownIcon,
  CheckIcon,
  PlusIcon,
  TrashIcon,
} from '@radix-ui/react-icons'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ['TRAVEL', 'MEALS', 'SOFTWARE', 'OFFICE SUPPLIES'] as const
const EMPLOYEES  = ['Jane Doe', 'John Smith', 'Alice Johnson', 'Bob Williams', 'Carol Brown'] as const

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const splitRowSchema = z.object({
  label:  z.string().min(1, 'Label is required'),
  amount: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Must be 0 or more'),
})

const expenseSchema = z
  .object({
    expenseName:  z.string().min(1, 'Expense name is required'),
    category:     z.string().min(1, 'Category is required'),
    employee:     z.string().min(1, 'Employee is required'),
    totalAmount:  z
      .number({
        required_error:      'Total amount is required',
        invalid_type_error:  'Must be a number',
      })
      .positive('Must be greater than 0'),
    splits: z.array(splitRowSchema).default([]),
  })
  .superRefine(function (data, ctx) {
    if (data.splits.length === 0) return
    const splitTotal = data.splits.reduce(function (sum, s) {
      return sum + (s.amount || 0)
    }, 0)
    // integer cents comparison avoids floating-point drift
    if (Math.round(splitTotal * 100) !== Math.round(data.totalAmount * 100)) {
      ctx.addIssue({
        code:    z.ZodIssueCode.custom,
        path:    ['splits'],
        message: `Split total ($${splitTotal.toFixed(2)}) must equal total amount ($${data.totalAmount.toFixed(2)})`,
      })
    }
  })

// ─── Types ────────────────────────────────────────────────────────────────────

type ExpenseFormValues = z.infer<typeof expenseSchema>

interface NewExpenseDialogProps {
  open:           boolean
  onOpenChange:   (open: boolean) => void
  onSubmit?:      (data: ExpenseFormValues) => void
  employees?:     string[]
}

interface FieldErrorProps {
  message?: string
}

interface FormSelectProps {
  value:        string
  onChange:     (value: string) => void
  placeholder:  string
  options:      readonly string[] | string[]
}

interface SplitRowProps {
  index:     number
  register:  ReturnType<typeof useForm<ExpenseFormValues>>['register']
  errors:    ReturnType<typeof useForm<ExpenseFormValues>>['formState']['errors']
  onRemove:  (index: number) => void
}

interface SplitTotalPillProps {
  splitTotal:   number
  totalAmount:  number
  balanced:     boolean
}

interface DialogFooterProps {
  canSubmit:  boolean
  onCancel:   () => void
}

// ─── FieldError ───────────────────────────────────────────────────────────────

function FieldError({ message }: FieldErrorProps) {
  if (!message) return null
  return (
    <p className="mt-1 text-xs text-red-500" role="alert">
      {message}
    </p>
  )
}

// ─── FormSelect ───────────────────────────────────────────────────────────────

function FormSelect({ value, onChange, placeholder, options }: FormSelectProps) {
  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger className="w-full flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-gray-300 transition-all data-[placeholder]:text-gray-400">
        <Select.Value placeholder={placeholder} />
        <Select.Icon>
          <ChevronDownIcon className="text-gray-400 w-4 h-4 shrink-0" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={4}
          className="z-[9999] w-[var(--radix-select-trigger-width)] bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1"
        >
          <Select.Viewport>
            {options.map(function (opt) {
              return (
                <Select.Item
                  key={opt}
                  value={opt}
                  className="flex items-center justify-between px-3.5 py-2.5 text-sm text-gray-700 cursor-pointer select-none outline-none hover:bg-indigo-50 hover:text-indigo-700 focus:bg-indigo-50 focus:text-indigo-700 data-[state=checked]:bg-indigo-50 data-[state=checked]:text-indigo-700"
                >
                  <Select.ItemText>{opt}</Select.ItemText>
                  <Select.ItemIndicator>
                    <CheckIcon className="text-indigo-500 w-4 h-4" />
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

// ─── SplitRow ─────────────────────────────────────────────────────────────────

function SplitRow({ index, register, errors, onRemove }: SplitRowProps) {
  const labelError  = errors.splits?.[index]?.label
  const amountError = errors.splits?.[index]?.amount

  return (
    <div className="flex items-start gap-2">
      {/* Label input */}
      <div className="flex-1">
        <input
          {...register(`splits.${index}.label`)}
          placeholder="Label"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        />
        <FieldError message={labelError?.message} />
      </div>

      {/* Amount input */}
      <div className="w-32">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
            $
          </span>
          <input
            {...register(`splits.${index}.amount`, { valueAsNumber: true })}
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            className="w-full rounded-lg border border-gray-200 pl-6 pr-2 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
        <FieldError message={amountError?.message} />
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={function () { onRemove(index) }}
        aria-label={`Remove split ${index + 1}`}
        className="mt-0.5 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─── SplitTotalPill ───────────────────────────────────────────────────────────

function SplitTotalPill({ splitTotal, totalAmount, balanced }: SplitTotalPillProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'mt-3 flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium border transition-colors',
        balanced
          ? 'bg-green-50 text-green-700 border-green-100'
          : 'bg-red-50 text-red-600 border-red-100',
      ].join(' ')}
    >
      <span>
        Split Total: ${splitTotal.toFixed(2)} / ${Number(totalAmount).toFixed(2)}
      </span>
      <span aria-hidden="true">{balanced ? '✅' : '❌'}</span>
    </div>
  )
}

// ─── DialogFooter ─────────────────────────────────────────────────────────────

function DialogFooter({ canSubmit, onCancel }: DialogFooterProps) {
  return (
    <div className="flex gap-3 pt-4 border-t border-gray-100">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={!canSubmit}
        className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Submit
      </button>
    </div>
  )
}

// ─── NewExpenseDialog ─────────────────────────────────────────────────────────

export default function NewExpenseDialog({
  open,
  onOpenChange,
  onSubmit,
  employees = [...EMPLOYEES],
}: NewExpenseDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    mode: 'onChange',
    defaultValues: {
      expenseName:  '',
      category:     '',
      employee:     '',
      totalAmount:  undefined,
      splits:       [],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'splits' })

  // ── Derived state ──
  const splits      = watch('splits')
  const totalAmount = watch('totalAmount') || 0
  const splitTotal  = splits.reduce(function (sum, s) {
    return sum + (Number(s.amount) || 0)
  }, 0)
  const hasSplits      = fields.length > 0
  const splitsBalanced = !hasSplits || Math.round(splitTotal * 100) === Math.round(totalAmount * 100)

  // ── Handlers ──
  function handleFormSubmit(data: ExpenseFormValues) {
    onSubmit?.(data)
    reset()
    onOpenChange(false)
  }

  function handleCancel() {
    reset()
    onOpenChange(false)
  }

  function handleAddSplit() {
    append({ label: '', amount: 0 })
  }

  // ── Render ──
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>

        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200" />

        {/* Content */}
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-6 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=open]:slide-in-from-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-top-[48%] duration-200">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-bold text-gray-900">
              New Expense
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                aria-label="Close dialog"
                className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Cross2Icon className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <form
            onSubmit={handleSubmit(handleFormSubmit)}
            className="space-y-5"
            noValidate
          >
            {/* ── Expense Name ── */}
            <div>
              <label
                htmlFor="expenseName"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Expense Name <span className="text-red-500">*</span>
              </label>
              <input
                id="expenseName"
                {...register('expenseName')}
                placeholder="e.g. Dinner with Client"
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-gray-300 transition-all"
              />
              <FieldError message={errors.expenseName?.message} />
            </div>

            {/* ── Category ── */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <Controller
                name="category"
                control={control}
                render={function ({ field }) {
                  return (
                    <FormSelect
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select category"
                      options={CATEGORIES}
                    />
                  )
                }}
              />
              <FieldError message={errors.category?.message} />
            </div>

            {/* ── Employee ── */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Employee <span className="text-red-500">*</span>
              </label>
              <Controller
                name="employee"
                control={control}
                render={function ({ field }) {
                  return (
                    <FormSelect
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select employee"
                      options={employees}
                    />
                  )
                }}
              />
              <FieldError message={errors.employee?.message} />
            </div>

            {/* ── Total Amount ── */}
            <div>
              <label
                htmlFor="totalAmount"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Total Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400 pointer-events-none">
                  $
                </span>
                <input
                  id="totalAmount"
                  {...register('totalAmount', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full rounded-lg border border-gray-200 pl-7 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-gray-300 transition-all"
                />
              </div>
              <FieldError message={errors.totalAmount?.message} />
            </div>

            {/* ── Splits ── */}
            <div>
              {/* Divider label */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  Splits
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Split rows */}
              <div className="space-y-2.5">
                {fields.map(function (field, index) {
                  return (
                    <SplitRow
                      key={field.id}
                      index={index}
                      register={register}
                      errors={errors}
                      onRemove={remove}
                    />
                  )
                })}
              </div>

              {/* Add split */}
              <button
                type="button"
                onClick={handleAddSplit}
                className="mt-3 flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Add Split
              </button>

              {/* Balanced indicator */}
              {hasSplits && (
                <SplitTotalPill
                  splitTotal={splitTotal}
                  totalAmount={totalAmount}
                  balanced={splitsBalanced}
                />
              )}

              {/* Cross-field Zod error */}
              {errors.splits?.message && (
                <p className="mt-1.5 text-xs text-red-500" role="alert">
                  {errors.splits.message}
                </p>
              )}
            </div>

            {/* ── Footer ── */}
            <DialogFooter canSubmit={isValid} onCancel={handleCancel} />
          </form>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
