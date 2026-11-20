export type WorkoutType = 'Correr' | 'Caminata' | 'Trail';

export type WorkoutFilter = 'Todos' | WorkoutType;

export interface WorkoutPayload {
  fecha: string;
  tipo: WorkoutType;
  distancia_km: number;
  duracion_min: number;
  notas: string;
}

export interface WorkoutRecord extends WorkoutPayload {
  id: string;
  ritmo: string;
  createdAt: string;
  syncStatus: 'sent' | 'local';
  aiAnalysis?: string;
}

export interface SyncStatusMessage {
  kind: 'success' | 'local' | 'error';
  title: string;
  detail: string;
}
