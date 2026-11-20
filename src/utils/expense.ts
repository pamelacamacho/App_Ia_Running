import type { ExpenseCategory, ExpenseRecord, PaymentMethod } from '../types/expense';

export const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwtU8vpdMsaOfIGiDL6I4xgwP3eGrfANhjdH07DdDHcKG5Cs0T56ChquSm2pTClC2E2fw/exec';

export const DEFAULT_MONTHLY_BUDGET = 12000;

export const STORAGE_KEYS = {
  EXPENSES: 'gastoflash_sheets_expenses_v1',
  SCRIPT_URL: 'gastoflash_sheets_script_url_v1',
  DEMO_MODE: 'gastoflash_sheets_demo_mode_v1',
  MONTHLY_BUDGET: 'gastoflash_sheets_budget_v1',
} as const;

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Comida',
  'Transporte',
  'Hogar',
  'Ocio',
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Tarjeta',
  'Efectivo',
  'Transferencia',
];

export function getTodayDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentMonthPrefix(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function formatMonthHeading(date: Date = new Date()): string {
  const formatted = new Intl.DateTimeFormat('es-ES', {
    month: 'long',
    year: 'numeric',
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatCurrency(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

export function getDaysInMonth(date: Date = new Date()): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function createDemoExpenses(referenceDate: Date = new Date()): ExpenseRecord[] {
  const monthPrefix = getCurrentMonthPrefix(referenceDate);
  const todayDay = referenceDate.getDate();

  const dayStr = (offsetDays: number): string => {
    const day = Math.max(1, todayDay - offsetDays);
    return `${monthPrefix}-${String(day).padStart(2, '0')}`;
  };

  return [
    {
      id: 'demo-exp-1',
      fecha: dayStr(0),
      categoria: 'Comida',
      monto: 385.5,
      metodo_pago: 'Tarjeta',
      notas: 'Despensa semanal de frutas, verduras y proteína.',
      createdAt: new Date(referenceDate.getTime() - 1000 * 60 * 60 * 2).toISOString(),
      syncStatus: 'local',
      aiAnalysis:
        'Compra equilibrada en alimentación básica (3.2% del presupuesto mensual). Planificar menús para 5 días evita pedidos impulsivos entre semana.',
    },
    {
      id: 'demo-exp-2',
      fecha: dayStr(1),
      categoria: 'Transporte',
      monto: 450,
      metodo_pago: 'Transferencia',
      notas: 'Recarga de gasolina y peaje urbano.',
      createdAt: new Date(referenceDate.getTime() - 1000 * 60 * 60 * 26).toISOString(),
      syncStatus: 'local',
    },
    {
      id: 'demo-exp-3',
      fecha: dayStr(3),
      categoria: 'Hogar',
      monto: 690,
      metodo_pago: 'Transferencia',
      notas: 'Pago mensual de internet residencial.',
      createdAt: new Date(referenceDate.getTime() - 1000 * 60 * 60 * 74).toISOString(),
      syncStatus: 'local',
    },
    {
      id: 'demo-exp-4',
      fecha: dayStr(5),
      categoria: 'Ocio',
      monto: 240,
      metodo_pago: 'Efectivo',
      notas: 'Café y cine de fin de semana.',
      createdAt: new Date(referenceDate.getTime() - 1000 * 60 * 60 * 120).toISOString(),
      syncStatus: 'local',
    },
  ];
}
