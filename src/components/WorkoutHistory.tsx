import { useMemo, useState } from 'react';
import {
  Database,
  Footprints,
  Mountain,
  PersonStanding,
  Trash2,
  WifiOff,
} from 'lucide-react';
import type { WorkoutFilter, WorkoutRecord, WorkoutType } from '../types/workout';

interface WorkoutHistoryProps {
  workouts: WorkoutRecord[];
  demoMode: boolean;
  onToggleDemoMode: (enabled: boolean) => void;
  onLoadDemoData: () => void;
  onDeleteWorkout: (id: string) => void;
  onClearAll: () => void;
}

const FILTER_OPTIONS: WorkoutFilter[] = ['Todos', 'Correr', 'Caminata', 'Trail'];

function ActivityIcon({ tipo }: { tipo: WorkoutType }) {
  if (tipo === 'Trail') {
    return <Mountain className="w-4 h-4 text-[#0B0D12]" aria-hidden="true" />;
  }
  if (tipo === 'Caminata') {
    return <Footprints className="w-4 h-4 text-[#0B0D12]" aria-hidden="true" />;
  }
  return <PersonStanding className="w-4 h-4 text-[#0B0D12]" aria-hidden="true" />;
}

export function WorkoutHistory({
  workouts,
  demoMode,
  onToggleDemoMode,
  onLoadDemoData,
  onDeleteWorkout,
  onClearAll,
}: WorkoutHistoryProps) {
  const [filter, setFilter] = useState<WorkoutFilter>('Todos');
  const [confirmClear, setConfirmClear] = useState(false);

  const filteredWorkouts = useMemo(() => {
    const base =
      filter === 'Todos'
        ? workouts
        : workouts.filter((item) => item.tipo === filter);

    return [...base].sort((a, b) => {
      if (a.fecha !== b.fecha) return b.fecha.localeCompare(a.fecha);
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [workouts, filter]);

  return (
    <section
      aria-label="Historial de entrenamientos"
      className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4"
    >
      {/* Cabecera e interruptor de modo demo / sin conexión */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-[#0B0D12]">
            Historial de sesiones
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
            {filteredWorkouts.length}{' '}
            {filteredWorkouts.length === 1 ? 'registro visible' : 'registros visibles'}
            {' · '}Guardado en este dispositivo
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={demoMode}
            onClick={() => onToggleDemoMode(!demoMode)}
            className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              demoMode
                ? 'bg-[#0B0D12] text-[#D9FF00] border-[#0B0D12]'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Modo demo / local: {demoMode ? 'Activo' : 'Inactivo'}</span>
          </button>
        </div>
      </div>

      {/* Filtros por tipo */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Filtrar por tipo de entrenamiento"
          className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto max-w-full"
        >
          {FILTER_OPTIONS.map((option) => {
            const active = filter === option;
            return (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(option)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-white text-[#0B0D12] shadow-xs'
                    : 'text-slate-600 hover:text-[#0B0D12]'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLoadDemoData}
            className="min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-[#0B0D12] hover:bg-slate-100 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <Database className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Cargar demo</span>
          </button>

          {workouts.length > 0 && !confirmClear && (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-red-700 hover:bg-red-50 transition-colors whitespace-nowrap shrink-0"
            >
              Limpiar
            </button>
          )}

          {confirmClear && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  onClearAll();
                  setConfirmClear(false);
                }}
                className="min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 whitespace-nowrap shrink-0"
              >
                Confirmar borrado
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 whitespace-nowrap shrink-0"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lista de sesiones */}
      {filteredWorkouts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-[#F9FAFB] px-4 py-10 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-800">
            {workouts.length === 0
              ? 'Aún no hay entrenamientos guardados'
              : `No hay sesiones registradas de tipo "${filter}"`}
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {workouts.length === 0
              ? 'Registra tu primera sesión en el formulario o carga datos de ejemplo para probar el resumen mensual y los filtros.'
              : 'Prueba seleccionar otro filtro o registra un nuevo entrenamiento de esta disciplina.'}
          </p>
          {workouts.length === 0 && (
            <button
              type="button"
              onClick={onLoadDemoData}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#0B0D12] text-white text-xs font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5 text-[#D9FF00]" aria-hidden="true" />
              <span>Cargar sesiones de ejemplo</span>
            </button>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {filteredWorkouts.map((item) => (
            <li key={item.id} className="py-4 first:pt-1 last:pb-1">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#F4F6F8] border border-slate-200/80 flex items-center justify-center shrink-0 mt-0.5">
                    <ActivityIcon tipo={item.tipo} />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                      <span className="font-semibold text-[#0B0D12] text-sm">
                        {item.tipo}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{item.fecha}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          item.syncStatus === 'sent'
                            ? 'text-emerald-700 font-medium'
                            : 'text-slate-500 font-medium'
                        }
                      >
                        {item.syncStatus === 'sent' ? 'Enviado a Sheets' : 'Solo local'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <span className="font-display text-2xl font-bold text-[#0B0D12] tabular-nums">
                        {item.distancia_km.toFixed(2)}{' '}
                        <span className="text-xs font-sans font-semibold text-slate-500">
                          km
                        </span>
                      </span>
                      <span className="font-mono text-sm font-semibold text-slate-700 tabular-nums">
                        {item.duracion_min} min
                      </span>
                      <span className="font-mono text-sm font-semibold text-[#0B0D12] tabular-nums">
                        {item.ritmo} min/km
                      </span>
                    </div>

                    {item.notas && (
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-0.5">
                        {item.notas}
                      </p>
                    )}

                    {item.aiAnalysis && (
                      <p className="text-xs text-slate-700 bg-[#F4F6F8] rounded-lg px-3 py-2 mt-1.5 leading-relaxed">
                        <span className="font-semibold text-[#0B0D12]">
                          Comentario IA:{' '}
                        </span>
                        {item.aiAnalysis}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteWorkout(item.id)}
                  aria-label={`Eliminar entrenamiento del ${item.fecha}`}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
