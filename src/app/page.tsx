"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  fetchExpenses,
  updateExpenseStatus,
  Expense,
} from "@/services/api.mock";
import {
  Check,
  X,
  ShieldAlert,
  Zap,
  BarChart3,
  ReceiptText,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import NewExpenseDialog from "./expenses/_components/newExpenseDialog";


export default function ExpensesDashboard() {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isNewExpenseDialogOpen, setNewExpenseDialogOpen] = useState(false)
  // Data Fetching
  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: fetchExpenses,
  });

  // Task 3 Starting Point: Standard sequential update
  const approveMutation = useMutation({
    mutationFn: (id: string) => updateExpenseStatus(id, "approved"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense approved");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };
 
  //Toggle Add New Expense Dialog
  const handleOpenNewExpenseDialog = () => setNewExpenseDialogOpen(open => !open)

  //Returns the sum of all expenses
  const expensesSum = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  //Formats the number approriately for display
  const formattedExpensesSum = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(expensesSum);

  const remainingBalance = 42890.12 - expensesSum

    //Formats the number approriately for display
  const formattedRemainingBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(remainingBalance);

  return (
    <div className="max-w-7xl mx-auto p-8">
      <Toaster richColors position="bottom-right" />
      <NewExpenseDialog open={isNewExpenseDialogOpen} onOpenChange={handleOpenNewExpenseDialog}
      onSubmit={(data) => console.log(data)}
      />

      <header className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2 font-sans">
            Expense Operations
          </h1>
          <p className="text-slate-500 text-lg">
            Manage your company's spending and approvals at scale.
          </p>
        </div>

        <div className="flex gap-3">
          <button className="btn btn-outline flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> View Insights
          </button>
          <button onClick={handleOpenNewExpenseDialog} className="btn btn-primary flex items-center gap-2 shadow-indigo-100">
            <ReceiptText className="w-4 h-4" /> New Expense
          </button>
        </div>
      </header>

      {/* Task 1: Create Expense Sheet (Mock placeholder) */}
      {/* Task 2: Spend Analysis Chart (Mock placeholder) */}

      <div className="grid grid-cols-12 gap-6">
        {/* Analytics Summary */}
        <div className="col-span-12 lg:col-span-4 card bg-indigo-600 border-none text-foreground">
          <h3 className="text-slate-500 font-medium mb-1">Total</h3>
          {/* Update to display the sum */}
          <p className="text-4xl font-bold">{formattedExpensesSum}</p>
        </div>
        <div className="col-span-12 lg:col-span-4 card">
          <h3 className="text-slate-500 font-medium mb-1">
            Approved this month
          </h3>
          <p className="text-4xl font-bold">$42,890.12</p>
        </div>
        <div className="col-span-12 lg:col-span-4 card">
          <h3 className="text-slate-500 font-medium mb-1">Active Staff</h3>
          <p className="text-4xl font-bold text-slate-900">124</p>
        </div>
        {/* Add a new card to display remaining balance */}
         <div className="col-span-12 lg:col-span-4 card">
          <h3 className="text-slate-500 font-medium mb-1">Remaining Balance</h3>
          <p className="text-4xl font-bold text-slate-900">{formattedRemainingBalance}</p>
        </div>

        {/* Expense List Section */}
        <div className="col-span-12 space-y-4">
          <div className="flex justify-between items-center py-2 px-1">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              Recent Submissions
              {selectedIds.size > 0 && (
                <span className="text-sm font-normal text-slate-500 ml-2 animate-in fade-in slide-in-from-left-2">
                  ({selectedIds.size} selected)
                </span>
              )}
            </h2>

            {selectedIds.size > 0 && (
              <div className="flex gap-2 animate-in slide-in-from-right-4 fade-in">
                <button
                  onClick={() => {
                    /* Task 3 implementation: Bulk Approve */
                  }}
                  className="btn bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Bulk Approve
                </button>
                <button className="btn btn-outline text-slate-500 border-none hover:bg-slate-100">
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="card p-0 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 w-12">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 transform scale-110"
                      onChange={(e) => {
                        if (e.target.checked)
                          setSelectedIds(new Set(expenses.map((e) => e.id)));
                        else setSelectedIds(new Set());
                      }}
                    />
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-600 text-sm">
                    EXPENSE
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-600 text-sm">
                    EMPLOYEE
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-right">
                    AMOUNT
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-600 text-sm">
                    STATUS
                  </th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-slate-400"
                    >
                      Loading expenses...
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className={`hover:bg-slate-50/50 transition-colors ${selectedIds.has(expense.id) ? "bg-indigo-50/30" : ""}`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(expense.id)}
                          onChange={() => toggleSelect(expense.id)}
                          className="rounded border-slate-300 transform scale-110 accent-indigo-600"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">
                          {expense.title}
                        </p>
                        <p className="text-xs text-slate-400 uppercase tracking-widest mt-0.5">
                          {expense.category}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {expense.employee}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-medium text-slate-900 underline decoration-slate-200 underline-offset-4 decoration-1">
                        ${expense.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${expense.status === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : expense.status === "approved"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                        >
                          {expense.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {expense.status === "pending" && (
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => approveMutation.mutate(expense.id)}
                              disabled={approveMutation.isPending}
                              className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-md"
                            >
                              {approveMutation.isPending ? (
                                <Zap className="w-5 h-5 animate-pulse" />
                              ) : (
                                <Check className="w-5 h-5" />
                              )}
                            </button>
                            <button className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-md">
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
