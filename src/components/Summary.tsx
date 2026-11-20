import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Check,
  Pencil,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import type { ExpenseCategory, ExpenseRecord } from '../types/expense';
import {
  EXPENSE_CATEGORIES,
  formatCurrency,
  formatMonthHeading,
  getCurrentMonthPrefix,
  getDaysInMonth,
} from '../utils/expense';

interface SummaryProps {
  expenses: ExpenseRecord[];
  monthlyBudget: number;
  onUpdateBudget: (budget: number) => void;
  referenceDate?: Date;
}

export function Summary({
  expenses,
  monthlyBudget,
  onUpdateBudget,
  referenceDate,
}: SummaryProps) {
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState(String(monthlyBudget));

  const monthStats = useMemo(() => {
    const now = referenceDate ?? new Date();
    const monthPrefix = getCurrentMonthPrefix(now);
    const monthLabel = formatMonthHeading(now);
    const elapsedDays = Math.max(1, now.getDate());
    const totalDaysInMonth = getDaysInMonth(now);

    const monthlyExpenses = expenses.filter((item) =>
      item.fecha.startsWith(monthPrefix),
    );

    const totalSpent = monthlyExpenses.reduce(
      (sum, item) => sum + (Number.isFinite(item.monto) ? item.monto : 0),
      0,
    );

    const byCategory: Record<ExpenseCategory, number> = {
      Comida: 0,
      Transporte: 0,
      Hogar: 0,
      Ocio: 0,
    };

    for (const item of monthlyExpenses) {
      if (item.categoria in byCategory) {
        byCategory[item.categoria] += Number.isFinite(item.monto) ? item.monto : 0;
      }
    }

    const remaining = monthlyBudget - totalSpent;
    const usedPercent =
      monthlyBudget > 0 ? Math.min(999, (totalSpent / monthlyBudget) * 100) : 0;
    const dailyAverage = totalSpent / elapsedDays;
    const projectedMonthEnd = dailyAverage * totalDaysInMonth;

    return {
      monthLabel,
      count: monthlyExpenses.length,
      totalSpent,
      remaining,
      usedPercent,
      dailyAverage,
      projectedMonthEnd,
      byCategory,
    };
  }, [expenses, monthlyBudget, referenceDate]);

  function handleSaveBudget() {
    const parsed = Number.parseFloat(budgetDraft.replace(',', '.'));
    if (Number.isFinite(parsed) && parsed > 0) {
      onUpdateBudget(Number(parsed.toFixed(2)));
    } else {
      setBudgetDraft(String(monthlyBudget));
    }
    setEditingBudget(false);
  }

  const isOverBudget = monthStats.remaining < 0;
  const isNearLimit = !isOverBudget && monthStats.usedPercent >= 80;

  return (
    <section
      aria-label="Resumen mensual de gastos y presupuesto"
      className="bg-[#0D1117] text-white rounded-2xl p-5 sm:p-6 shadow-sm space-y-5"
    >
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-white/12">
        <div>
          <p className="text-xs font-medium text-white/65 tracking-wide">
            Resumen financiero del mes
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white mt-0.5">
            {monthStats.monthLabel}
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/75 font-medium">
          <Calendar className="w-3.5 h-3.5 text-[#34D399]" aria-hidden="true" />
          <span className="tabular-nums">
            {monthStats.count} {monthStats.count === 1 ? 'gasto' : 'gastos'} este mes
          </span>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-white/65">
            <Wallet className="w-3.5 h-3.5 text-[#34D399]" aria-hidden="true" />
            <span>Total gastado</span>
          </div>
          <p className="font-display text-4xl font-extrabold tracking-tight text-white tabular-nums">
            {formatCurrency(monthStats.totalSpent)}
          </p>
          <p className="text-xs text-white/60 tabular-nums">
            {monthStats.usedPercent.toFixed(1)}% del presupuesto mensual
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-xs text-white/65">
            <span>{isOverBudget ? 'Excedido por' : 'Disponible'}</span>
            {!editingBudget && (
              <button
                type="button"
                onClick={() => {
                  setBudgetDraft(String(monthlyBudget));
                  setEditingBudget(true);
                }}
                className="text-xs text-[#34D399] hover:text-[#6EE7B7] font-semibold inline-flex items-center gap-1"
              >
                <Pencil className="w-3 h-3" aria-hidden="true" />
                <span>Presupuesto</span>
              </button>
            )}
          </div>

          <p
            className={`font-display text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums ${
              isOverBudget
                ? 'text-rose-400'
                : isNearLimit
                  ? 'text-amber-300'
                  : 'text-[#34D399]'
            }`}
          >
            {formatCurrency(Math.abs(monthStats.remaining))}
          </p>

          {editingBudget ? (
            <div className="flex items-center gap-1.5 pt-1">
              <input
                type="number"
                inputMode="decimal"
                min="1"
                step="100"
                aria-label="Nuevo presupuesto mensual"
                value={budgetDraft}
                onChange={(e) => setBudgetDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveBudget();
                  }
                }}
                className="w-28 px-2.5 py-1 rounded-lg bg-white/10 border border-white/25 text-xs font-mono text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-[#34D399]"
              />
              <button
                type="button"
                onClick={handleSaveBudget}
                aria-label="Guardar presupuesto"
                className="min-h-[30px] px-2.5 py-1 rounded-lg bg-[#34D399] text-[#0D1117] text-xs font-bold inline-flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>OK</span>
              </button>
            </div>
          ) : (
            <p className="text-xs text-white/60 tabular-nums">
              Tope: {formatCurrency(monthlyBudget)}
            </p>
          )}
        </div>

        <div className="pt-3 sm:pt-0 border-t border-white/10 sm:border-t-0 sm:border-l sm:border-white/10 sm:pl-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-white/65">
            <TrendingUp className="w-3.5 h-3.5 text-white/75" aria-hidden="true" />
            <span>Promedio diario</span>
          </div>
          <p className="font-mono text-xl sm:text-2xl font-bold text-white tabular-nums">
            {formatCurrency(monthStats.dailyAverage)}
          </p>
          <p className="text-xs text-white/60 tabular-nums">
            Proyección mes: {formatCurrency(monthStats.projectedMonthEnd)}
          </p>
        </div>
      </div>

      {/* Barra de consumo de presupuesto */}
      <div className="space-y-2">
        <div
          className="h-2.5 w-full rounded-full bg-white/12 overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.min(100, Math.round(monthStats.usedPercent))}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Porcentaje del presupuesto mensual utilizado"
        >
          <div
            style={{ width: `${Math.min(100, monthStats.usedPercent)}%` }}
            className={`h-full transition-all duration-300 ${
              isOverBudget
                ? 'bg-rose-400'
                : isNearLimit
                  ? 'bg-amber-400'
                  : 'bg-[#34D399]'
            }`}
          />
        </div>

        {isOverBudget && (
          <div className="flex items-center gap-1.5 text-xs text-rose-300 font-medium">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Has superado tu presupuesto configurado para este mes.</span>
          </div>
        )}
      </div>

      {/* Desglose por categoría */}
      {monthStats.totalSpent > 0 && (
        <div className="pt-3 border-t border-white/10 space-y-2.5">
          <div
            className="h-2 w-full rounded-full bg-white/10 overflow-hidden flex"
            role="img"
            aria-label="Distribución de gastos por categoría"
          >
            {EXPENSE_CATEGORIES.map((category) => {
              const amount = monthStats.byCategory[category];
              if (amount <= 0) return null;
              const pct = (amount / monthStats.totalSpent) * 100;
              return (
                <div
                  key={category}
                  style={{ width: `${pct}%` }}
                  className={
                    category === 'Comida'
                      ? 'bg-[#34D399]'
                      : category === 'Transporte'
                        ? 'bg-sky-400'
                        : category === 'Hogar'
                          ? 'bg-amber-300'
                          : 'bg-white/60'
                  }
                  title={`${category}: ${formatCurrency(amount)}`}
                />
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/80">
            {EXPENSE_CATEGORIES.map((category) => {
              const amount = monthStats.byCategory[category];
              if (amount <= 0) return null;
              return (
                <div key={category} className="flex items-center gap-1.5 tabular-nums">
                  <span
                    className={`inline-block w-2 h-2 rounded-xs ${
                      category === 'Comida'
                        ? 'bg-[#34D399]'
                        : category === 'Transporte'
                          ? 'bg-sky-400'
                          : category === 'Hogar'
                            ? 'bg-amber-300'
                            : 'bg-white/60'
                    }`}
                    aria-hidden="true"
                  />
                  <span>
                    {category}: {formatCurrency(amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
