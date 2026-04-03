'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { Cross2Icon, PlusIcon } from '@radix-ui/react-icons'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CATEGORIES, EMPLOYEES } from './constants'
import { expenseSchema, type ExpenseFormValues } from './schema'
import type { NewExpenseDialogProps } from './types'
import { DialogFooter } from './_components/DialogFooter'
import { FieldError } from './_components/FieldError'
import { FormSelect } from './_components/FormSelect'
import { SplitRow } from './_components/SplitRow'
import { SplitTotalPill } from './_components/SplitTotalPill'

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
      expenseName: '',
      category: '',
      employee: '',
      totalAmount: undefined,
      splits: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'splits',
  })

  const splits = watch('splits')
  const totalAmount = watch('totalAmount') || 0
  const splitTotal = splits.reduce(function (sum, split) {
    return sum + (Number(split.amount) || 0)
  }, 0)
  const hasSplits = fields.length > 0
  const splitsBalanced =
    !hasSplits || Math.round(splitTotal * 100) === Math.round(totalAmount * 100)

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

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />

        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                New Expense
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-gray-500">
                Add a new expense and optionally split it across labels.
              </Dialog.Description>
            </div>

            <Dialog.Close asChild>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 text-gray-600 transition hover:bg-gray-50"
                aria-label="Close dialog"
              >
                <Cross2Icon className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Expense Name *
              </label>
              <input
                {...register('expenseName')}
                type="text"
                placeholder="Enter expense name"
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none transition focus:border-gray-500"
              />
              <FieldError message={errors.expenseName?.message} />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Category *
                </label>
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <FormSelect
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="Select category"
                      options={CATEGORIES}
                    />
                  )}
                />
                <FieldError message={errors.category?.message} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Employee *
                </label>
                <Controller
                  control={control}
                  name="employee"
                  render={({ field }) => (
                    <FormSelect
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="Select employee"
                      options={employees}
                    />
                  )}
                />
                <FieldError message={errors.employee?.message} />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Total Amount *
              </label>
              <input
                {...register('totalAmount', { valueAsNumber: true })}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none transition focus:border-gray-500"
              />
              <FieldError message={errors.totalAmount?.message} />
            </div>

            <div className="space-y-4 rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Splits
                </h3>
                <button
                  type="button"
                  onClick={handleAddSplit}
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Split
                </button>
              </div>

              <div className="space-y-3">
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

              {hasSplits ? (
                <div className="flex flex-wrap items-center gap-3">
                  <SplitTotalPill
                    splitTotal={splitTotal}
                    totalAmount={totalAmount}
                    balanced={splitsBalanced}
                  />
                  {errors.splits?.message ? (
                    <p className="text-sm text-red-600">{errors.splits.message}</p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <DialogFooter canSubmit={isValid && splitsBalanced} onCancel={handleCancel} />
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
