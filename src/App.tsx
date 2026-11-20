import { useEffect, useState } from 'react';
import { ListChecks, PlusCircle, Settings2 } from 'lucide-react';
import { AppsScriptConfig } from './components/AppsScriptConfig';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseHistory } from './components/ExpenseHistory';
import { Summary } from './components/Summary';
import type { ExpenseRecord } from './types/expense';
import {
  createDemoExpenses,
  DEFAULT_APPS_SCRIPT_URL,
  DEFAULT_MONTHLY_BUDGET,
  STORAGE_KEYS,
} from './utils/expense';

type ActiveTab = 'registrar' | 'historial' | 'conexion';

function loadInitialExpenses(): ExpenseRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ExpenseRecord[]) : [];
  } catch {
    return [];
  }
}

function loadInitialScriptUrl(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SCRIPT_URL);
    return stored && stored.trim() ? stored : DEFAULT_APPS_SCRIPT_URL;
  } catch {
    return DEFAULT_APPS_SCRIPT_URL;
  }
}

function loadInitialBudget(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MONTHLY_BUDGET);
    if (!raw) return DEFAULT_MONTHLY_BUDGET;
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MONTHLY_BUDGET;
  } catch {
    return DEFAULT_MONTHLY_BUDGET;
  }
}

function loadInitialDemoMode(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.DEMO_MODE) === 'true';
  } catch {
    return false;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('registrar');
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(loadInitialExpenses);
  const [scriptUrl, setScriptUrl] = useState<string>(loadInitialScriptUrl);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(loadInitialBudget);
  const [demoMode, setDemoMode] = useState<boolean>(loadInitialDemoMode);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    } catch {
      // Ignore storage quota errors
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SCRIPT_URL, scriptUrl);
    } catch {
      // Ignore storage errors
    }
  }, [scriptUrl]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MONTHLY_BUDGET, String(monthlyBudget));
    } catch {
      // Ignore storage errors
    }
  }, [monthlyBudget]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DEMO_MODE, String(demoMode));
    } catch {
      // Ignore storage errors
    }
  }, [demoMode]);

  function handleSaveExpense(record: ExpenseRecord) {
    setExpenses((prev) => [record, ...prev]);
  }

  function handleDeleteExpense(id: string) {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
  }

  function handleClearAll() {
    setExpenses([]);
  }

  function handleLoadDemoData() {
    const demos = createDemoExpenses();
    setExpenses((prev) => {
      const existingIds = new Set(prev.map((item) => item.id));
      const newOnes = demos.filter((d) => !existingIds.has(d.id));
      return [...newOnes, ...prev];
    });
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8] text-[#0D1117] pb-24 lg:pb-12">
      {/* Top Bar: 3-zone contract */}
      <header className="bg-white border-b border-slate-200/90">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('registrar');
            }}
            className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-[#0D1117] whitespace-nowrap shrink-0"
          >
            GastoFlash Sheets
          </a>

          <nav
            aria-label="Navegación principal"
            className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600"
          >
            <button
              type="button"
              onClick={() => setActiveTab('registrar')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'registrar'
                  ? 'text-[#0D1117] underline decoration-2 underline-offset-8 decoration-[#059669]'
                  : 'hover:text-[#0D1117]'
              }`}
            >
              Registrar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('historial')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'historial'
                  ? 'text-[#0D1117] underline decoration-2 underline-offset-8 decoration-[#059669]'
                  : 'hover:text-[#0D1117]'
              }`}
            >
              Historial
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('conexion')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'conexion'
                  ? 'text-[#0D1117] underline decoration-2 underline-offset-8 decoration-[#059669]'
                  : 'hover:text-[#0D1117]'
              }`}
            >
              Conexión
            </button>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setDemoMode((prev) => !prev)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                demoMode
                  ? 'bg-[#34D399] text-[#0D1117]'
                  : 'bg-[#0D1117] text-white hover:bg-slate-800'
              }`}
            >
              {demoMode ? 'Modo local activo' : 'Sincronía Sheets'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="top" className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8">
        {/* Desktop 2-column workspace (lg+) */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-7 items-start">
          <div className="lg:col-span-5">
            {activeTab === 'conexion' ? (
              <AppsScriptConfig
                scriptUrl={scriptUrl}
                monthlyBudget={monthlyBudget}
                demoMode={demoMode}
                onSaveScriptUrl={setScriptUrl}
                onSaveBudget={setMonthlyBudget}
                onToggleDemoMode={setDemoMode}
              />
            ) : (
              <ExpenseForm
                expenses={expenses}
                monthlyBudget={monthlyBudget}
                scriptUrl={scriptUrl}
                demoMode={demoMode}
                onSaveExpense={handleSaveExpense}
                onOpenConfig={() => setActiveTab('conexion')}
              />
            )}
          </div>

          <div className="lg:col-span-7 space-y-6">
            <Summary
              expenses={expenses}
              monthlyBudget={monthlyBudget}
              onUpdateBudget={setMonthlyBudget}
            />
            <ExpenseHistory
              expenses={expenses}
              demoMode={demoMode}
              onToggleDemoMode={setDemoMode}
              onLoadDemoData={handleLoadDemoData}
              onDeleteExpense={handleDeleteExpense}
              onClearAll={handleClearAll}
            />
          </div>
        </div>

        {/* Mobile / Tablet single-column view (< lg) */}
        <div className="lg:hidden space-y-5">
          {activeTab === 'registrar' && (
            <>
              <ExpenseForm
                expenses={expenses}
                monthlyBudget={monthlyBudget}
                scriptUrl={scriptUrl}
                demoMode={demoMode}
                onSaveExpense={handleSaveExpense}
                onOpenConfig={() => setActiveTab('conexion')}
              />
              <Summary
                expenses={expenses}
                monthlyBudget={monthlyBudget}
                onUpdateBudget={setMonthlyBudget}
              />
            </>
          )}

          {activeTab === 'historial' && (
            <>
              <Summary
                expenses={expenses}
                monthlyBudget={monthlyBudget}
                onUpdateBudget={setMonthlyBudget}
              />
              <ExpenseHistory
                expenses={expenses}
                demoMode={demoMode}
                onToggleDemoMode={setDemoMode}
                onLoadDemoData={handleLoadDemoData}
                onDeleteExpense={handleDeleteExpense}
                onClearAll={handleClearAll}
              />
            </>
          )}

          {activeTab === 'conexion' && (
            <AppsScriptConfig
              scriptUrl={scriptUrl}
              monthlyBudget={monthlyBudget}
              demoMode={demoMode}
              onSaveScriptUrl={setScriptUrl}
              onSaveBudget={setMonthlyBudget}
              onToggleDemoMode={setDemoMode}
            />
          )}
        </div>
      </main>

      {/* Mobile Bottom Thumb Navigation (< lg, <= 15% sticky height cap) */}
      <nav
        aria-label="Navegación móvil"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe"
      >
        <div className="grid grid-cols-3 h-16 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab('registrar')}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'registrar'
                ? 'text-[#059669]'
                : 'text-slate-500 hover:text-[#0D1117]'
            }`}
          >
            <PlusCircle
              className={`w-5 h-5 ${
                activeTab === 'registrar' ? 'text-[#059669]' : 'text-slate-400'
              }`}
              aria-hidden="true"
            />
            <span>Registrar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('historial')}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'historial'
                ? 'text-[#059669]'
                : 'text-slate-500 hover:text-[#0D1117]'
            }`}
          >
            <ListChecks
              className={`w-5 h-5 ${
                activeTab === 'historial' ? 'text-[#059669]' : 'text-slate-400'
              }`}
              aria-hidden="true"
            />
            <span>Historial ({expenses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('conexion')}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'conexion'
                ? 'text-[#059669]'
                : 'text-slate-500 hover:text-[#0D1117]'
            }`}
          >
            <Settings2
              className={`w-5 h-5 ${
                activeTab === 'conexion' ? 'text-[#059669]' : 'text-slate-400'
              }`}
              aria-hidden="true"
            />
            <span>Conexión</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
