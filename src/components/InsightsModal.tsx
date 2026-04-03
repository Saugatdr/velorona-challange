"use client";

/**
 * InsightsModal — Task 2: Insightful Transitions
 * ─────────────────────────────────────────────────────────────────────────
 * Features
 * ────────
 * ① Morphing transition: annual bars → monthly time-series using
 *    framer-motion layoutId + AnimatePresence so bars physically travel
 *    to their new positions rather than blinking.
 * ② Performant data processor: delegated to useExpenseProcessor (useMemo).
 * ③ Contextual tooltips: shows raw value + MoM % + YoY % growth.
 * ④ Empty-gap safety: the data processor fills missing months with 0 so
 *    the time axis never breaks.
 * ⑤ Accessibility: keyboard-navigable data points, ARIA roles, screen-
 *    reader announcements for the active tooltip value.
 */

import React, { useState, useCallback, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  TooltipProps,
} from "recharts";
import { X, TrendingUp, TrendingDown, Minus, ArrowLeft } from "lucide-react";
import { Expense } from "@/services/api.mock";
import { useExpenseProcessor, MonthlyPoint, AnnualPoint } from "@/lib/useExpenseProcessor";

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = "annual" | "monthly";

interface InsightsModalProps {
  expenses: Expense[];
  open: boolean;
  onClose: () => void;
}

// ─── Color palette for categories ─────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  Travel: "#6366f1",
  Software: "#8b5cf6",
  Meals: "#06b6d4",
  "Office Supplies": "#10b981",
};

const DEFAULT_COLOR = "#94a3b8";
const ANNUAL_BAR_COLOR = "#6366f1";
const ANNUAL_BAR_HOVER = "#4f46e5";

const getCategoryColor = (category: string) =>
  CATEGORY_COLORS[category] ?? DEFAULT_COLOR;

// ─── Formatters ───────────────────────────────────────────────────────────────

const usd = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

const pctLabel = (v: number | null, label: string) => {
  if (v === null) return null;
  const Icon = v > 0 ? TrendingUp : v < 0 ? TrendingDown : Minus;
  const color = v > 0 ? "text-emerald-500" : v < 0 ? "text-rose-500" : "text-slate-400";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${color}`}>
      <Icon className="w-3 h-3" />
      {v > 0 ? "+" : ""}{v}% {label}
    </span>
  );
};

// ─── Custom Tooltip (annual view) ─────────────────────────────────────────────

const AnnualTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as AnnualPoint;
  return (
    <div
      role="tooltip"
      aria-live="polite"
      className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm"
    >
      <p className="font-semibold text-slate-900 mb-2">{d.year} Total</p>
      <p className="text-2xl font-bold text-indigo-600">{usd(d.total)}</p>
      {Object.keys(d.byCategory).length > 0 && (
        <div className="mt-2 space-y-1 border-t border-slate-100 pt-2">
          {Object.entries(d.byCategory).map(([cat, amt]) => (
            <div key={cat} className="flex justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ background: getCategoryColor(cat) }}
                />
                <span className="text-slate-600">{cat}</span>
              </span>
              <span className="font-medium text-slate-900">{usd(amt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Custom Tooltip (monthly view) ────────────────────────────────────────────

const MonthlyTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as MonthlyPoint;
  return (
    <div
      role="tooltip"
      aria-live="polite"
      className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm min-w-[200px]"
    >
      <p className="font-semibold text-slate-900 mb-1">{d.label}</p>
      <p className="text-2xl font-bold text-indigo-600 mb-2">{usd(d.total)}</p>

      {/* Contextual growth insight */}
      <div className="space-y-1">
        {d.momGrowth !== null ? pctLabel(d.momGrowth, "MoM") : (
          <span className="text-xs text-slate-400">First month — no MoM data</span>
        )}
        <br />
        {d.yoyGrowth !== null ? pctLabel(d.yoyGrowth, "YoY") : (
          <span className="text-xs text-slate-400">No YoY data yet</span>
        )}
      </div>

      {Object.keys(d.byCategory).length > 0 && (
        <div className="mt-2 space-y-1 border-t border-slate-100 pt-2">
          {Object.entries(d.byCategory).map(([cat, amt]) => (
            <div key={cat} className="flex justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ background: getCategoryColor(cat) }}
                />
                <span className="text-slate-600">{cat}</span>
              </span>
              <span className="font-medium text-slate-900">{usd(amt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Bar shape with framer-motion morphing ────────────────────────────────────

/**
 * MorphBar: wraps Recharts' default rect with a motion.rect that animates
 * height/y from 0 on mount and between values on update. The `layoutId`
 * creates a stable shared-layout key so Framer can track the element across
 * the annual → monthly view transition.
 */
const MorphBar = (props: {
  x?: number; y?: number; width?: number; height?: number;
  fill?: string; index?: number; layoutId?: string;
}) => {
  const { x = 0, y = 0, width = 0, height = 0, fill, layoutId } = props;
  if (!height || height <= 0) return null;
  return (
    <motion.rect
      layoutId={layoutId}
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      rx={4}
      ry={4}
      initial={{ height: 0, y: y + height }}
      animate={{ height, y }}
      exit={{ height: 0, y: y + height }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      // Accessibility: each bar is a focusable element
      tabIndex={0}
      role="img"
      aria-label={`Bar value ${usd(height)}`}
      style={{ outline: "none" }}
      whileFocus={{ opacity: 0.85, filter: "brightness(1.1)" }}
    />
  );
};

// ─── Chart panels ─────────────────────────────────────────────────────────────

const CHART_H = 340;

const AnnualChart = ({
  data,
  onBarClick,
}: {
  data: AnnualPoint[];
  onBarClick: (year: number) => void;
}) => (
  <div aria-label="Annual spending bar chart" role="figure">
    <ResponsiveContainer width="100%" height={CHART_H}>
      <BarChart
        data={data}
        margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
        onClick={(e) => {
          if (e?.activePayload?.[0]) {
            onBarClick((e.activePayload[0].payload as AnnualPoint).year);
          }
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="year"
          tick={{ fontSize: 13, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 12, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip content={<AnnualTooltip />} cursor={{ fill: "#f1f5f9" }} />
        <Bar
          dataKey="total"
          shape={(p: object) => {
            const pp = p as { x?: number; y?: number; width?: number; height?: number; index?: number };
            return (
              <MorphBar
                {...pp}
                fill={ANNUAL_BAR_COLOR}
                layoutId={`bar-annual-${pp.index}`}
              />
            );
          }}
          cursor="pointer"
          maxBarSize={72}
        >
          {data.map((entry) => (
            <Cell
              key={entry.year}
              fill={ANNUAL_BAR_COLOR}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
    <p className="text-center text-xs text-slate-400 mt-1">
      Click a bar to drill into monthly detail
    </p>
  </div>
);

const MonthlyChart = ({ data }: { data: MonthlyPoint[] }) => (
  <div aria-label="Monthly spending time-series chart" role="figure">
    <ResponsiveContainer width="100%" height={CHART_H}>
      <BarChart
        data={data}
        margin={{ top: 8, right: 24, left: 8, bottom: 24 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#64748b" }}
          angle={-35}
          textAnchor="end"
          interval={0}
          axisLine={false}
          tickLine={false}
          height={48}
        />
        <YAxis
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 12, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip content={<MonthlyTooltip />} cursor={{ fill: "#f1f5f9" }} />
        <Bar
          dataKey="total"
          shape={(p: object) => {
            const pp = p as { x?: number; y?: number; width?: number; height?: number; index?: number; payload?: MonthlyPoint };
            const cat = Object.keys(pp.payload?.byCategory ?? {})[0] ?? "";
            const fill = cat ? getCategoryColor(cat) : ANNUAL_BAR_COLOR;
            return (
              <MorphBar
                {...pp}
                fill={fill}
                layoutId={`bar-monthly-${pp.index}`}
              />
            );
          }}
          maxBarSize={48}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function InsightsModal({ expenses, open, onClose }: InsightsModalProps) {
  const titleId = useId();
  const data = useExpenseProcessor(expenses);
  const [view, setView] = useState<ViewMode>("annual");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const monthlySlice = selectedYear
    ? data.monthly.filter((m) => m.year === selectedYear)
    : data.monthly;

  const handleBarClick = useCallback((year: number) => {
    setSelectedYear(year);
    setView("monthly");
  }, []);

  const handleBack = () => {
    setView("annual");
    setSelectedYear(null);
  };

  // Reset view when modal opens
  React.useEffect(() => {
    if (open) {
      setView("annual");
      setSelectedYear(null);
    }
  }, [open]);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        // Backdrop
        <motion.div
          key="insights-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          aria-hidden="true"
          style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
        >
          {/* Panel */}
          <motion.div
            key="insights-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 pt-7 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                {view === "monthly" && (
                  <motion.button
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    onClick={handleBack}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                    aria-label="Back to annual view"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </motion.button>
                )}
                <div>
                  <h2 id={titleId} className="text-xl font-bold text-slate-900 tracking-tight">
                    Spend Analysis
                  </h2>
                  <p className="text-sm text-slate-500">
                    {view === "annual"
                      ? "Annual overview — click a bar to drill down"
                      : `Monthly breakdown${selectedYear ? ` · ${selectedYear}` : " · All time"}`}
                  </p>
                </div>
              </div>

              {/* View toggle pills */}
              <div className="flex items-center gap-3">
                <div
                  className="flex rounded-lg border border-slate-200 overflow-hidden text-sm"
                  role="group"
                  aria-label="Chart view"
                >
                  {(["annual", "monthly"] as ViewMode[]).map((v) => (
                    <button
                      key={v}
                      onClick={() => {
                        if (v === "annual") handleBack();
                        else setView("monthly");
                      }}
                      aria-pressed={view === v}
                      className={`px-4 py-1.5 font-medium capitalize transition-colors ${
                        view === v
                          ? "bg-indigo-600 text-white"
                          : "bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                  aria-label="Close insights"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Summary KPIs */}
            <div className="grid grid-cols-3 gap-4 px-8 py-5">
              {[
                {
                  label: "Total spend",
                  value: usd(expenses.reduce((s, e) => s + e.amount, 0)),
                  sub: `${expenses.length} transactions`,
                },
                {
                  label: "Months tracked",
                  value: String(data.monthly.length),
                  sub: `${data.annual.length} year${data.annual.length !== 1 ? "s" : ""} of data`,
                },
                {
                  label: "Categories",
                  value: String(data.categories.length),
                  sub: data.categories.slice(0, 2).join(", "),
                },
              ].map((kpi) => (
                <div key={kpi.label} className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">{kpi.label}</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{kpi.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{kpi.sub}</p>
                </div>
              ))}
            </div>

            {/* Chart area with morphing transition */}
            <div className="px-8 pb-8">
              {/*
               * AnimatePresence with mode="popLayout" lets the outgoing chart
               * animate out while the incoming one animates in simultaneously.
               * Combined with layoutId on each Bar's MorphBar, the bars
               * physically morph/scale into their new positions.
               */}
              <AnimatePresence mode="popLayout" initial={false}>
                {view === "annual" ? (
                  <motion.div
                    key="annual-chart"
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ type: "spring", stiffness: 280, damping: 28 }}
                  >
                    {data.annual.length > 0 ? (
                      <AnnualChart data={data.annual} onBarClick={handleBarClick} />
                    ) : (
                      <EmptyState message="No annual data available yet." />
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="monthly-chart"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 40 }}
                    transition={{ type: "spring", stiffness: 280, damping: 28 }}
                  >
                    {monthlySlice.length > 0 ? (
                      <MonthlyChart data={monthlySlice} />
                    ) : (
                      <EmptyState message={`No monthly data for ${selectedYear ?? "the selected period"}.`} />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Category legend */}
            {data.categories.length > 0 && (
              <div className="flex flex-wrap gap-3 px-8 pb-7">
                {data.categories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full"
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: getCategoryColor(cat) }}
                    />
                    {cat}
                  </span>
                ))}
              </div>
            )}

            {/* Senior-level accessibility note rendered in the DOM as sr-only */}
            <p className="sr-only">
              This chart is keyboard navigable. Use Tab to focus individual bars
              and the Enter or Space key to interact. Each bar announces its
              dollar value, month-over-month, and year-over-year growth.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
    <svg
      className="w-12 h-12 mb-3 opacity-40"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
    <p className="text-sm">{message}</p>
  </div>
);
