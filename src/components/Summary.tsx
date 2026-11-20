import { useMemo } from 'react';
import { Calendar, Clock, Gauge, Route } from 'lucide-react';
import type { WorkoutRecord, WorkoutType } from '../types/workout';
import {
  calculatePace,
  formatMonthHeading,
  formatTotalHoursMinutes,
  getCurrentMonthPrefix,
} from '../utils/workout';

interface SummaryProps {
  workouts: WorkoutRecord[];
  referenceDate?: Date;
}

const DISCIPLINE_COLORS: Record<WorkoutType, string> = {
  Correr: 'bg-[#0B0D12]',
  Trail: 'bg-[#475569]',
  Caminata: 'bg-[#94A3B8]',
};

export function Summary({ workouts, referenceDate }: SummaryProps) {
  const monthData = useMemo(() => {
    const now = referenceDate ?? new Date();
    const currentMonthPrefix = getCurrentMonthPrefix(now);
    const monthLabel = formatMonthHeading(now);

    const monthlyWorkouts = workouts.filter((workout) =>
      workout.fecha.startsWith(currentMonthPrefix),
    );

    const totalDistanceKm = monthlyWorkouts.reduce(
      (sum, item) => sum + (Number.isFinite(item.distancia_km) ? item.distancia_km : 0),
      0,
    );

    const totalDurationMin = monthlyWorkouts.reduce(
      (sum, item) => sum + (Number.isFinite(item.duracion_min) ? item.duracion_min : 0),
      0,
    );

    const byType: Record<WorkoutType, number> = {
      Correr: 0,
      Trail: 0,
      Caminata: 0,
    };

    for (const item of monthlyWorkouts) {
      if (item.tipo in byType) {
        byType[item.tipo] += Number.isFinite(item.distancia_km) ? item.distancia_km : 0;
      }
    }

    const avgPace = calculatePace(totalDistanceKm, totalDurationMin);

    return {
      monthLabel,
      sessionCount: monthlyWorkouts.length,
      totalDistanceKm,
      totalDurationMin,
      avgPace,
      byType,
    };
  }, [workouts, referenceDate]);

  return (
    <section
      aria-label="Resumen mensual de entrenamientos"
      className="bg-[#0B0D12] text-white rounded-2xl p-5 sm:p-6 shadow-sm"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4 border-b border-white/12">
        <div>
          <p className="text-xs font-medium text-white/65 tracking-wide">
            Resumen del mes actual
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white mt-0.5">
            {monthData.monthLabel}
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/75 font-medium">
          <Calendar className="w-3.5 h-3.5 text-[#D9FF00]" aria-hidden="true" />
          <span className="tabular-nums">
            {monthData.sessionCount}{' '}
            {monthData.sessionCount === 1 ? 'sesión registrada' : 'sesiones registradas'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-5 sm:grid-cols-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-white/65">
            <Route className="w-3.5 h-3.5 text-[#D9FF00]" aria-hidden="true" />
            <span>Distancia total</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-[#D9FF00] tabular-nums">
              {monthData.totalDistanceKm.toFixed(2)}
            </span>
            <span className="text-sm font-semibold text-white/75">km</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-white/65">
            <Clock className="w-3.5 h-3.5 text-[#D9FF00]" aria-hidden="true" />
            <span>Duración total</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-white tabular-nums">
              {Math.round(monthData.totalDurationMin)}
            </span>
            <span className="text-sm font-semibold text-white/75">min</span>
          </div>
          <p className="text-xs text-white/60 tabular-nums">
            {formatTotalHoursMinutes(monthData.totalDurationMin)} acumulado
          </p>
        </div>

        <div className="col-span-2 sm:col-span-1 pt-3 sm:pt-0 border-t border-white/10 sm:border-t-0 sm:border-l sm:border-white/10 sm:pl-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-white/65">
            <Gauge className="w-3.5 h-3.5 text-white/70" aria-hidden="true" />
            <span>Ritmo medio mensual</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-2xl sm:text-3xl font-bold text-white tabular-nums">
              {monthData.avgPace.formatted}
            </span>
            <span className="text-xs font-medium text-white/65">min/km</span>
          </div>
          <p className="text-xs text-white/55 truncate">
            {monthData.sessionCount > 0
              ? monthData.avgPace.zoneLabel
              : 'Registra tu primera sesión del mes'}
          </p>
        </div>
      </div>

      {monthData.totalDistanceKm > 0 && (
        <div className="mt-5 pt-4 border-t border-white/10">
          <div
            className="h-2 w-full rounded-full bg-white/10 overflow-hidden flex"
            role="img"
            aria-label="Distribución de distancia por tipo de entrenamiento"
          >
            {(['Correr', 'Trail', 'Caminata'] as WorkoutType[]).map((type) => {
              const km = monthData.byType[type];
              if (km <= 0) return null;
              const pct = (km / monthData.totalDistanceKm) * 100;
              return (
                <div
                  key={type}
                  style={{ width: `${pct}%` }}
                  className={
                    type === 'Correr'
                      ? 'bg-[#D9FF00]'
                      : type === 'Trail'
                        ? 'bg-white'
                        : 'bg-white/40'
                  }
                  title={`${type}: ${km.toFixed(2)} km`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-xs text-white/75">
            {(['Correr', 'Trail', 'Caminata'] as WorkoutType[]).map((type) => {
              const km = monthData.byType[type];
              if (km <= 0) return null;
              return (
                <div key={type} className="flex items-center gap-1.5 tabular-nums">
                  <span
                    className={`inline-block w-2 h-2 rounded-xs ${
                      type === 'Correr'
                        ? 'bg-[#D9FF00]'
                        : type === 'Trail'
                          ? 'bg-white'
                          : 'bg-white/40'
                    }`}
                    aria-hidden="true"
                  />
                  <span>
                    {type}: {km.toFixed(1)} km
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

export { DISCIPLINE_COLORS };
