import type { WorkoutRecord, WorkoutType } from '../types/workout';

export const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwtU8vpdMsaOfIGiDL6I4xgwP3eGrfANhjdH07DdDHcKG5Cs0T56ChquSm2pTClC2E2fw/exec';

export const STORAGE_KEYS = {
  WORKOUTS: 'runtracker_sheets_workouts_v1',
  SCRIPT_URL: 'runtracker_sheets_script_url_v1',
  DEMO_MODE: 'runtracker_sheets_demo_mode_v1',
} as const;

export const WORKOUT_TYPES: WorkoutType[] = ['Correr', 'Caminata', 'Trail'];

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

export function calculatePace(
  distanciaKm: number,
  duracionMin: number,
): { formatted: string; secondsPerKm: number | null; zoneLabel: string } {
  if (
    !Number.isFinite(distanciaKm) ||
    !Number.isFinite(duracionMin) ||
    distanciaKm <= 0 ||
    duracionMin <= 0
  ) {
    return {
      formatted: '--:--',
      secondsPerKm: null,
      zoneLabel: 'Ingresa distancia y duración',
    };
  }

  const secondsPerKm = Math.round((duracionMin * 60) / distanciaKm);
  const mins = Math.floor(secondsPerKm / 60);
  const secs = secondsPerKm % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  let zoneLabel = 'Ritmo aeróbico';
  if (secondsPerKm < 255) {
    zoneLabel = 'Alta intensidad / Series';
  } else if (secondsPerKm < 315) {
    zoneLabel = 'Ritmo tempo / Vivo';
  } else if (secondsPerKm < 390) {
    zoneLabel = 'Rodaje constante';
  } else if (secondsPerKm < 540) {
    zoneLabel = 'Trote suave / Trail técnico';
  } else {
    zoneLabel = 'Caminata o recuperación';
  }

  return { formatted, secondsPerKm, zoneLabel };
}

export function formatTotalHoursMinutes(totalMinutes: number): string {
  const rounded = Math.round(totalMinutes);
  const hours = Math.floor(rounded / 60);
  const mins = rounded % 60;
  if (hours === 0) {
    return `${mins} min`;
  }
  return `${hours} h ${String(mins).padStart(2, '0')} min`;
}

export function createDemoWorkouts(referenceDate: Date = new Date()): WorkoutRecord[] {
  const monthPrefix = getCurrentMonthPrefix(referenceDate);
  const todayDay = referenceDate.getDate();

  const dayStr = (offsetDays: number): string => {
    const day = Math.max(1, todayDay - offsetDays);
    return `${monthPrefix}-${String(day).padStart(2, '0')}`;
  };

  return [
    {
      id: 'demo-1',
      fecha: dayStr(0),
      tipo: 'Correr',
      distancia_km: 8.4,
      duracion_min: 42,
      ritmo: calculatePace(8.4, 42).formatted,
      notas: 'Rodaje progresivo por parque, últimos 2 km más rápidos.',
      createdAt: new Date(referenceDate.getTime() - 1000 * 60 * 60 * 3).toISOString(),
      syncStatus: 'local',
      aiAnalysis:
        'Buen rodaje progresivo a 05:00 min/km. Mantén la cadencia fluida y prioriza hidratación más 10 minutos de movilidad de tobillo y cadera.',
    },
    {
      id: 'demo-2',
      fecha: dayStr(2),
      tipo: 'Trail',
      distancia_km: 12.2,
      duracion_min: 78,
      ritmo: calculatePace(12.2, 78).formatted,
      notas: 'Sendero con desnivel acumulado de 380 m, terreno seco.',
      createdAt: new Date(referenceDate.getTime() - 1000 * 60 * 60 * 48).toISOString(),
      syncStatus: 'local',
    },
    {
      id: 'demo-3',
      fecha: dayStr(5),
      tipo: 'Caminata',
      distancia_km: 5.5,
      duracion_min: 54,
      ritmo: calculatePace(5.5, 54).formatted,
      notas: 'Descanso activo a paso constante después de tirada larga.',
      createdAt: new Date(referenceDate.getTime() - 1000 * 60 * 60 * 120).toISOString(),
      syncStatus: 'local',
    },
  ];
}
