import { useMemo, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  HardDrive,
  Loader2,
  Send,
  Sparkles,
} from 'lucide-react';
import type {
  ExpenseCategory,
  ExpensePayload,
  ExpenseRecord,
  PaymentMethod,
  SyncStatusMessage,
} from '../types/expense';
import {
  EXPENSE_CATEGORIES,
  formatCurrency,
  getCurrentMonthPrefix,
  getTodayDateString,
  PAYMENT_METHODS,
} from '../utils/expense';

interface ExpenseFormProps {
  expenses: ExpenseRecord[];
  monthlyBudget: number;
  scriptUrl: string;
  demoMode: boolean;
  onSaveExpense: (record: ExpenseRecord) => void;
  onOpenConfig: () => void;
}

export function ExpenseForm({
  expenses,
  monthlyBudget,
  scriptUrl,
  demoMode,
  onSaveExpense,
  onOpenConfig,
}: ExpenseFormProps) {
  const [fecha, setFecha] = useState<string>(() => getTodayDateString());
  const [categoria, setCategoria] = useState<ExpenseCategory>('Comida');
  const [montoInput, setMontoInput] = useState<string>('');
  const [metodoPago, setMetodoPago] = useState<PaymentMethod>('Tarjeta');
  const [notas, setNotas] = useState<string>('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [aiError, setAiError] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<SyncStatusMessage | null>(null);

  const monto = Number.parseFloat(montoInput.replace(',', '.'));
  const hasValidAmount = Number.isFinite(monto) && monto > 0;

  const monthlySpent = useMemo(() => {
    const monthPrefix = getCurrentMonthPrefix();
    return expenses
      .filter((item) => item.fecha.startsWith(monthPrefix))
      .reduce((sum, item) => sum + (Number.isFinite(item.monto) ? item.monto : 0), 0);
  }, [expenses]);

  const budgetImpact = useMemo(() => {
    const amount = hasValidAmount ? monto : 0;
    const budgetPct = monthlyBudget > 0 ? (amount / monthlyBudget) * 100 : 0;
    const remainingAfter = monthlyBudget - (monthlySpent + amount);
    return {
      budgetPct,
      remainingAfter,
      exceeds: remainingAfter < 0,
    };
  }, [hasValidAmount, monto, monthlyBudget, monthlySpent]);

  async function handleAnalyzeWithAI() {
    if (!hasValidAmount) {
      setAiError('Ingresa un monto mayor a 0 para analizar este gasto con IA.');
      return;
    }

    setIsAnalyzing(true);
    setAiError('');

    try {
      const response = await fetch('/api/analyze-expense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fecha,
          categoria,
          monto: Number(monto.toFixed(2)),
          metodo_pago: metodoPago,
          notas: notas.trim(),
          monthlySpent,
          monthlyBudget,
        }),
      });

      const data = (await response.json()) as { analisis?: string; error?: string };

      if (!response.ok || !data.analisis) {
        throw new Error(
          data.error || 'No se pudo obtener el análisis financiero de Gemini.',
        );
      }

      setAiAnalysis(data.analisis);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Error de conexión al analizar el gasto con Gemini.';
      setAiError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage(null);

    if (!fecha) {
      setStatusMessage({
        kind: 'error',
        title: 'Falta la fecha',
        detail: 'Selecciona una fecha válida en formato YYYY-MM-DD.',
      });
      return;
    }

    if (!hasValidAmount) {
      setStatusMessage({
        kind: 'error',
        title: 'Monto inválido',
        detail: 'Ingresa un monto mayor a 0 para guardar el gasto.',
      });
      return;
    }

    const payload: ExpensePayload = {
      fecha,
      categoria,
      monto: Number(monto.toFixed(2)),
      metodo_pago: metodoPago,
      notas: notas.trim(),
    };

    const newRecord: ExpenseRecord = {
      ...payload,
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `gf-${Date.now()}`,
      createdAt: new Date().toISOString(),
      syncStatus: demoMode ? 'local' : 'sent',
      aiAnalysis: aiAnalysis || undefined,
    };

    if (demoMode) {
      onSaveExpense(newRecord);
      setStatusMessage({
        kind: 'local',
        title: 'Gasto guardado en modo demo / local',
        detail: `${payload.categoria} por ${formatCurrency(payload.monto)} guardado en este dispositivo sin enviarse a Google Sheets.`,
      });
      setMontoInput('');
      setNotas('');
      setAiAnalysis('');
      setAiError('');
      return;
    }

    const targetUrl = scriptUrl.trim();
    if (!targetUrl) {
      setStatusMessage({
        kind: 'error',
        title: 'URL de Apps Script vacía',
        detail: 'Configura la URL /exec en Conexión o activa el modo demo.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await fetch(targetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      onSaveExpense(newRecord);
      setStatusMessage({
        kind: 'success',
        title: 'Envío disparado hacia Google Sheets',
        detail: `Se registró "${payload.categoria}" (${formatCurrency(payload.monto)} · ${payload.metodo_pago}) en Sheets y en tu historial local.`,
      });

      setMontoInput('');
      setNotas('');
      setAiAnalysis('');
      setAiError('');
    } catch (err) {
      const savedLocalRecord: ExpenseRecord = {
        ...newRecord,
        syncStatus: 'local',
      };
      onSaveExpense(savedLocalRecord);
      const errMsg =
        err instanceof Error ? err.message : 'Fallo de red al contactar Apps Script.';
      setStatusMessage({
        kind: 'error',
        title: 'No se pudo contactar la URL de Google Apps Script',
        detail: `${errMsg} El gasto se guardó localmente para no perderlo.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5"
      noValidate
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0D1117]">
            Registrar gasto
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Anota en segundos y controla tu presupuesto mensual
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenConfig}
          className="text-xs font-medium text-slate-600 hover:text-[#0D1117] underline underline-offset-4 whitespace-nowrap shrink-0 min-h-[40px] px-1"
        >
          {demoMode ? 'Modo local activo' : 'Configurar URL'}
        </button>
      </div>

      {/* Monto + Fecha */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label
            htmlFor="expense-monto"
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            Monto ($)
          </label>
          <input
            id="expense-monto"
            name="monto"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            placeholder="245.00"
            value={montoInput}
            onChange={(e) => setMontoInput(e.target.value)}
            required
            className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F9FAFB] text-lg font-bold text-[#0D1117] font-mono tabular-nums placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D1117] focus:bg-white transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="expense-fecha"
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            Fecha
          </label>
          <input
            id="expense-fecha"
            name="fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
            className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F9FAFB] text-sm font-medium text-[#0D1117] font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0D1117] focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Categoría */}
      <div>
        <span className="block text-xs font-semibold text-slate-700 mb-1.5">
          Categoría
        </span>
        <div
          role="radiogroup"
          aria-label="Categoría del gasto"
          className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl"
        >
          {EXPENSE_CATEGORIES.map((option) => {
            const active = categoria === option;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setCategoria(option)}
                className={`min-h-[44px] px-2.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#0D1117] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#0D1117] hover:bg-white/60'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      {/* Método de pago */}
      <div>
        <span className="block text-xs font-semibold text-slate-700 mb-1.5">
          Método de pago
        </span>
        <div
          role="radiogroup"
          aria-label="Método de pago"
          className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl"
        >
          {PAYMENT_METHODS.map((method) => {
            const active = metodoPago === method;
            return (
              <button
                key={method}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setMetodoPago(method)}
                className={`min-h-[44px] px-2.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-white text-[#0D1117] shadow-xs'
                    : 'text-slate-600 hover:text-[#0D1117]'
                }`}
              >
                {method}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cálculo automático en tiempo real del impacto en presupuesto */}
      <div className="rounded-xl bg-[#F4F6F8] border border-slate-200/80 px-4 py-3.5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-600">
            Impacto en presupuesto mensual
          </p>
          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
            {budgetImpact.exceeds
              ? `Excede por ${formatCurrency(Math.abs(budgetImpact.remainingAfter))}`
              : `Disponible tras gasto: ${formatCurrency(budgetImpact.remainingAfter)}`}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span
            className={`font-mono text-2xl font-bold tabular-nums ${
              budgetImpact.exceeds ? 'text-rose-600' : 'text-[#059669]'
            }`}
          >
            {hasValidAmount ? `${budgetImpact.budgetPct.toFixed(1)}%` : '0.0%'}
          </span>
          <p className="text-[11px] text-slate-500">del tope mensual</p>
        </div>
      </div>

      {/* Notas */}
      <div>
        <label
          htmlFor="expense-notas"
          className="block text-xs font-semibold text-slate-700 mb-1.5"
        >
          Notas o comercio
        </label>
        <input
          id="expense-notas"
          name="notas"
          type="text"
          placeholder="Ej. Café, despensa semanal, recarga de transporte..."
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F9FAFB] text-sm text-[#0D1117] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D1117] focus:bg-white transition-colors"
        />
      </div>

      {/* Botón Analizar con IA */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleAnalyzeWithAI}
          disabled={isAnalyzing}
          className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:scale-[0.99] text-sm font-semibold text-[#0D1117] flex items-center justify-center gap-2 transition-all disabled:opacity-60 whitespace-nowrap"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Analizando gasto...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-[#059669]" aria-hidden="true" />
              <span>Analizar con IA</span>
            </>
          )}
        </button>

        {aiError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs text-red-800 flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{aiError}</span>
          </div>
        )}

        {aiAnalysis && (
          <div className="rounded-xl bg-[#0D1117] text-white px-4 py-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[#34D399] font-semibold">
              <span>Diagnóstico financiero (Gemini)</span>
              <span className="font-mono tabular-nums text-white/75">
                {hasValidAmount ? formatCurrency(monto) : ''}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-white/90">{aiAnalysis}</p>
          </div>
        )}
      </div>

      {/* Estado de envío */}
      {statusMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-xl border px-3.5 py-3 text-xs flex items-start gap-2.5 ${
            statusMessage.kind === 'error'
              ? 'border-red-200 bg-red-50 text-red-900'
              : statusMessage.kind === 'local'
                ? 'border-amber-200 bg-amber-50 text-amber-950'
                : 'border-emerald-200 bg-emerald-50 text-emerald-950'
          }`}
        >
          {statusMessage.kind === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
          ) : statusMessage.kind === 'local' ? (
            <HardDrive className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
          ) : (
            <CheckCircle2
              className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5"
              aria-hidden="true"
            />
          )}
          <div className="space-y-0.5">
            <p className="font-semibold text-sm">{statusMessage.title}</p>
            <p className="leading-relaxed opacity-90">{statusMessage.detail}</p>
          </div>
        </div>
      )}

      {/* Botón principal de guardar/enviar */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full min-h-[50px] px-5 py-3 rounded-xl bg-[#059669] hover:bg-[#047857] active:scale-[0.99] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-60 whitespace-nowrap"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            <span>Enviando a Google Sheets...</span>
          </>
        ) : demoMode ? (
          <>
            <HardDrive className="w-4 h-4" aria-hidden="true" />
            <span>Guardar gasto (Modo local)</span>
          </>
        ) : (
          <>
            <Send className="w-4 h-4" aria-hidden="true" />
            <span>Guardar y enviar a Google Sheets</span>
          </>
        )}
      </button>
    </form>
  );
}
