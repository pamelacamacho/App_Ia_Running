import { useMemo, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Send,
  Sparkles,
  HardDrive,
} from 'lucide-react';
import type { SyncStatusMessage, WorkoutPayload, WorkoutRecord, WorkoutType } from '../types/workout';
import { calculatePace, getTodayDateString, WORKOUT_TYPES } from '../utils/workout';

interface WorkoutFormProps {
  scriptUrl: string;
  demoMode: boolean;
  onSaveWorkout: (record: WorkoutRecord) => void;
  onOpenConfig: () => void;
}

export function WorkoutForm({
  scriptUrl,
  demoMode,
  onSaveWorkout,
  onOpenConfig,
}: WorkoutFormProps) {
  const [fecha, setFecha] = useState<string>(() => getTodayDateString());
  const [tipo, setTipo] = useState<WorkoutType>('Correr');
  const [distanciaInput, setDistanciaInput] = useState<string>('');
  const [duracionInput, setDuracionInput] = useState<string>('');
  const [notas, setNotas] = useState<string>('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [aiError, setAiError] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<SyncStatusMessage | null>(null);

  const distanciaKm = Number.parseFloat(distanciaInput.replace(',', '.'));
  const duracionMin = Number.parseFloat(duracionInput.replace(',', '.'));

  const pace = useMemo(
    () => calculatePace(distanciaKm, duracionMin),
    [distanciaKm, duracionMin],
  );

  const hasValidMetrics =
    Number.isFinite(distanciaKm) &&
    distanciaKm > 0 &&
    Number.isFinite(duracionMin) &&
    duracionMin > 0;

  async function handleAnalyzeWithAI() {
    if (!hasValidMetrics) {
      setAiError('Ingresa distancia (km) y duración (min) mayores a 0 para analizar con IA.');
      return;
    }

    setIsAnalyzing(true);
    setAiError('');

    try {
      const response = await fetch('/api/analyze-workout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fecha,
          tipo,
          distancia_km: Number(distanciaKm.toFixed(2)),
          duracion_min: Number(duracionMin.toFixed(1)),
          ritmo: pace.formatted,
          notas: notas.trim(),
        }),
      });

      const data = (await response.json()) as { analisis?: string; error?: string };

      if (!response.ok || !data.analisis) {
        throw new Error(
          data.error || 'No se pudo obtener el análisis del entrenador IA.',
        );
      }

      setAiAnalysis(data.analisis);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Error de conexión al analizar la sesión con Gemini.';
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

    if (!hasValidMetrics) {
      setStatusMessage({
        kind: 'error',
        title: 'Datos incompletos',
        detail: 'Ingresa una distancia en km y una duración en minutos mayores a 0.',
      });
      return;
    }

    const payload: WorkoutPayload = {
      fecha,
      tipo,
      distancia_km: Number(distanciaKm.toFixed(2)),
      duracion_min: Number(duracionMin.toFixed(1)),
      notas: notas.trim(),
    };

    const newRecord: WorkoutRecord = {
      ...payload,
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `rt-${Date.now()}`,
      ritmo: pace.formatted,
      createdAt: new Date().toISOString(),
      syncStatus: demoMode ? 'local' : 'sent',
      aiAnalysis: aiAnalysis || undefined,
    };

    if (demoMode) {
      onSaveWorkout(newRecord);
      setStatusMessage({
        kind: 'local',
        title: 'Guardado en modo demo / local',
        detail:
          'El entrenamiento se almacenó en este dispositivo sin enviarse a Google Sheets.',
      });
      setDistanciaInput('');
      setDuracionInput('');
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
        detail: 'Configura la URL /exec en la pestaña Conexión o activa el modo demo.',
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

      onSaveWorkout(newRecord);
      setStatusMessage({
        kind: 'success',
        title: 'Envío disparado hacia Google Sheets',
        detail: `Se envió "${payload.tipo}" (${payload.distancia_km} km · ${pace.formatted} min/km) a tu hoja mediante Apps Script y se guardó en el historial local.`,
      });

      setDistanciaInput('');
      setDuracionInput('');
      setNotas('');
      setAiAnalysis('');
      setAiError('');
    } catch (err) {
      const savedLocalRecord: WorkoutRecord = {
        ...newRecord,
        syncStatus: 'local',
      };
      onSaveWorkout(savedLocalRecord);
      const errMsg =
        err instanceof Error ? err.message : 'Fallo de red al contactar Apps Script.';
      setStatusMessage({
        kind: 'error',
        title: 'No se pudo contactar la URL de Google Apps Script',
        detail: `${errMsg} El registro se guardó localmente en tu historial para no perderlo.`,
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
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0D12]">
            Registrar entrenamiento
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cálculo de ritmo automático y envío directo a Google Sheets
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenConfig}
          className="text-xs font-medium text-slate-600 hover:text-[#0B0D12] underline underline-offset-4 whitespace-nowrap shrink-0 min-h-[40px] px-1"
        >
          {demoMode ? 'Modo local activo' : 'Configurar URL'}
        </button>
      </div>

      {/* Fecha y Tipo */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="workout-fecha"
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            Fecha de la sesión
          </label>
          <input
            id="workout-fecha"
            name="fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
            className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F9FAFB] text-sm font-medium text-[#0B0D12] font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0B0D12] focus:bg-white transition-colors"
          />
        </div>

        <div>
          <span className="block text-xs font-semibold text-slate-700 mb-1.5">
            Tipo de actividad
          </span>
          <div
            role="radiogroup"
            aria-label="Tipo de actividad"
            className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl"
          >
            {WORKOUT_TYPES.map((option) => {
              const active = tipo === option;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setTipo(option)}
                  className={`min-h-[44px] px-3 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#0B0D12] text-[#D9FF00] shadow-xs'
                      : 'text-slate-600 hover:text-[#0B0D12] hover:bg-white/60'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Distancia y Duración */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="workout-distancia"
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            Distancia (km)
          </label>
          <input
            id="workout-distancia"
            name="distancia_km"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            placeholder="8.50"
            value={distanciaInput}
            onChange={(e) => setDistanciaInput(e.target.value)}
            required
            className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F9FAFB] text-base font-semibold text-[#0B0D12] font-mono tabular-nums placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B0D12] focus:bg-white transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="workout-duracion"
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            Duración (min)
          </label>
          <input
            id="workout-duracion"
            name="duracion_min"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0.1"
            placeholder="45"
            value={duracionInput}
            onChange={(e) => setDuracionInput(e.target.value)}
            required
            className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F9FAFB] text-base font-semibold text-[#0B0D12] font-mono tabular-nums placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B0D12] focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Panel de Ritmo en tiempo real */}
      <div className="rounded-xl bg-[#F4F6F8] border border-slate-200/80 px-4 py-3.5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">Ritmo en tiempo real</p>
          <p className="text-xs text-slate-600 mt-0.5">{pace.zoneLabel}</p>
        </div>
        <div className="text-right">
          <div className="flex items-baseline justify-end gap-1">
            <span
              data-testid="live-pace"
              className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0D12] tabular-nums"
            >
              {pace.formatted}
            </span>
            <span className="text-xs font-semibold text-slate-600">min/km</span>
          </div>
        </div>
      </div>

      {/* Notas */}
      <div>
        <label
          htmlFor="workout-notas"
          className="block text-xs font-semibold text-slate-700 mb-1.5"
        >
          Notas de la sesión
        </label>
        <textarea
          id="workout-notas"
          name="notas"
          rows={2}
          placeholder="Sensaciones, terreno, clima o intervalos..."
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F9FAFB] text-sm text-[#0B0D12] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B0D12] focus:bg-white transition-colors resize-none"
        />
      </div>

      {/* Botón Analizar con IA y resultado Gemini */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleAnalyzeWithAI}
          disabled={isAnalyzing}
          className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:scale-[0.99] text-sm font-semibold text-[#0B0D12] flex items-center justify-center gap-2 transition-all disabled:opacity-60 whitespace-nowrap"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Analizando sesión...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-[#0B0D12]" aria-hidden="true" />
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
          <div className="rounded-xl bg-[#0B0D12] text-white px-4 py-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[#D9FF00] font-semibold">
              <span>Análisis de entrenamiento (Gemini)</span>
              <span className="font-mono tabular-nums text-white/70">
                {pace.formatted} min/km
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

      {/* Botón Submit principal */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full min-h-[50px] px-5 py-3 rounded-xl bg-[#D9FF00] hover:bg-[#ceef00] active:scale-[0.99] text-[#0B0D12] font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-60 whitespace-nowrap"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            <span>Enviando a Google Sheets...</span>
          </>
        ) : demoMode ? (
          <>
            <HardDrive className="w-4 h-4" aria-hidden="true" />
            <span>Guardar entrenamiento (Modo local)</span>
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
