import { useState, type FormEvent } from 'react';
import { Check, Copy, Link2, RotateCcw, WifiOff } from 'lucide-react';
import { DEFAULT_APPS_SCRIPT_URL, DEFAULT_MONTHLY_BUDGET } from '../utils/expense';

interface AppsScriptConfigProps {
  scriptUrl: string;
  monthlyBudget: number;
  demoMode: boolean;
  onSaveScriptUrl: (url: string) => void;
  onSaveBudget: (budget: number) => void;
  onToggleDemoMode: (enabled: boolean) => void;
}

const SAMPLE_APPS_SCRIPT_CODE = `function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    data.fecha,
    data.categoria,
    data.monto,
    data.metodo_pago,
    data.notas
  ]);
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

export function AppsScriptConfig({
  scriptUrl,
  monthlyBudget,
  demoMode,
  onSaveScriptUrl,
  onSaveBudget,
  onToggleDemoMode,
}: AppsScriptConfigProps) {
  const [draftUrl, setDraftUrl] = useState(scriptUrl);
  const [draftBudget, setDraftBudget] = useState(String(monthlyBudget));
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = draftUrl.trim() || DEFAULT_APPS_SCRIPT_URL;
    setDraftUrl(trimmed);
    onSaveScriptUrl(trimmed);

    const parsedBudget = Number.parseFloat(draftBudget.replace(',', '.'));
    if (Number.isFinite(parsedBudget) && parsedBudget > 0) {
      onSaveBudget(Number(parsedBudget.toFixed(2)));
    } else {
      setDraftBudget(String(DEFAULT_MONTHLY_BUDGET));
      onSaveBudget(DEFAULT_MONTHLY_BUDGET);
    }

    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2400);
  }

  function handleRestoreDefault() {
    setDraftUrl(DEFAULT_APPS_SCRIPT_URL);
    onSaveScriptUrl(DEFAULT_APPS_SCRIPT_URL);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2400);
  }

  async function handleCopyScript() {
    try {
      await navigator.clipboard.writeText(SAMPLE_APPS_SCRIPT_CODE);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2200);
    } catch {
      // Clipboard may be blocked in restricted contexts
    }
  }

  return (
    <section
      aria-label="Configuración de presupuesto y Google Apps Script"
      className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-[#0D1117]">
            Conexión y presupuesto
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Tope mensual y envío directo mediante Google Apps Script sin OAuth
          </p>
        </div>
        <Link2 className="w-5 h-5 text-slate-400 shrink-0 mt-1" aria-hidden="true" />
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label
            htmlFor="monthly-budget-input"
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            Presupuesto mensual ($)
          </label>
          <input
            id="monthly-budget-input"
            type="number"
            inputMode="decimal"
            min="1"
            step="50"
            value={draftBudget}
            onChange={(e) => setDraftBudget(e.target.value)}
            required
            className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F9FAFB] text-sm font-mono font-semibold text-[#0D1117] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0D1117] focus:bg-white transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="apps-script-url"
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            URL de Google Apps Script (/exec)
          </label>
          <input
            id="apps-script-url"
            type="url"
            value={draftUrl}
            onChange={(e) => setDraftUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec"
            required
            className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F9FAFB] text-xs sm:text-sm font-mono text-[#0D1117] focus:outline-none focus:ring-2 focus:ring-[#0D1117] focus:bg-white transition-colors"
          />
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Se guarda en <span className="font-mono">localStorage</span> y recibe peticiones{' '}
            <span className="font-mono">POST</span> con{' '}
            <span className="font-mono">mode: &apos;no-cors&apos;</span> y{' '}
            <span className="font-mono">text/plain;charset=utf-8</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="submit"
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0D1117] hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            {savedFeedback ? (
              <>
                <Check className="w-4 h-4 text-[#34D399]" aria-hidden="true" />
                <span>Configuración guardada</span>
              </>
            ) : (
              <span>Guardar cambios</span>
            )}
          </button>

          <button
            type="button"
            onClick={handleRestoreDefault}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs sm:text-sm font-semibold text-slate-700 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Restaurar URL</span>
          </button>
        </div>
      </form>

      {/* Modo demo / local */}
      <div className="rounded-xl bg-[#F4F6F8] border border-slate-200/80 p-4 flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-[#0D1117]">
            Modo demo / local (sin conexión)
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            Guarda los gastos únicamente en tu navegador sin enviar POST a Google Sheets.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={demoMode}
          onClick={() => onToggleDemoMode(!demoMode)}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
            demoMode
              ? 'bg-[#0D1117] text-[#34D399]'
              : 'bg-white border border-slate-300 text-[#0D1117] hover:bg-slate-50'
          }`}
        >
          <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{demoMode ? 'Activo' : 'Activar'}</span>
        </button>
      </div>

      {/* Carga JSON */}
      <div className="space-y-2 pt-1">
        <p className="text-xs font-semibold text-slate-700">
          Carga JSON enviada al endpoint /exec
        </p>
        <pre className="rounded-xl bg-[#0D1117] text-[#E2E8F0] p-3.5 text-xs font-mono overflow-x-auto leading-relaxed">
          {`{
  "fecha": "2026-11-19",
  "categoria": "Comida",
  "monto": 245.5,
  "metodo_pago": "Tarjeta",
  "notas": "Despensa semanal"
}`}
        </pre>
      </div>

      {/* Código de referencia Apps Script */}
      <details className="rounded-xl border border-slate-200 bg-[#F9FAFB] p-3.5">
        <summary className="text-xs font-semibold text-[#0D1117] cursor-pointer select-none">
          Ver código de referencia para Google Apps Script (doPost)
        </summary>
        <div className="mt-3 space-y-2.5">
          <pre className="rounded-lg bg-white border border-slate-200 p-3 text-[11px] font-mono text-slate-800 overflow-x-auto leading-relaxed">
            {SAMPLE_APPS_SCRIPT_CODE}
          </pre>
          <button
            type="button"
            onClick={handleCopyScript}
            className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0D1117] inline-flex items-center gap-1.5"
          >
            {copiedCode ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                <span>Código copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Copiar doPost</span>
              </>
            )}
          </button>
        </div>
      </details>
    </section>
  );
}
