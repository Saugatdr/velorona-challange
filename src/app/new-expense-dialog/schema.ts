import { z } from 'zod'

export const splitRowSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  amount: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Must be 0 or more'),
})

export const expenseSchema = z
  .object({
    expenseName: z.string().min(1, 'Expense name is required'),
    category: z.string().min(1, 'Category is required'),
    employee: z.string().min(1, 'Employee is required'),
    totalAmount: z
      .number({
        required_error: 'Total amount is required',
        invalid_type_error: 'Must be a number',
      })
      .positive('Must be greater than 0'),
    splits: z.array(splitRowSchema).default([]),
  })
  .superRefine(function (data, ctx) {
    if (data.splits.length === 0) return

    const splitTotal = data.splits.reduce(function (sum, split) {
      return sum + (split.amount || 0)
    }, 0)

    if (Math.round(splitTotal * 100) !== Math.round(data.totalAmount * 100)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['splits'],
        message: `Split total ($${splitTotal.toFixed(2)}) must equal total amount ($${data.totalAmount.toFixed(2)})`,
      })
    }
  })

export type ExpenseFormValues = z.infer<typeof expenseSchema>
