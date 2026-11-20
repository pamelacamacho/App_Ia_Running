export type ExpenseCategory = 'Comida' | 'Transporte' | 'Hogar' | 'Ocio';

export type ExpenseFilter = 'Todas' | ExpenseCategory;

export type PaymentMethod = 'Tarjeta' | 'Efectivo' | 'Transferencia';

export interface ExpensePayload {
  fecha: string;
  categoria: ExpenseCategory;
  monto: number;
  metodo_pago: PaymentMethod;
  notas: string;
}

export interface ExpenseRecord extends ExpensePayload {
  id: string;
  createdAt: string;
  syncStatus: 'sent' | 'local';
  aiAnalysis?: string;
}

export interface SyncStatusMessage {
  kind: 'success' | 'local' | 'error';
  title: string;
  detail: string;
}
