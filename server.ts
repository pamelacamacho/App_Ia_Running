import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

interface AnalyzeWorkoutBody {
  fecha?: string;
  tipo?: string;
  distancia_km?: number;
  duracion_min?: number;
  ritmo?: string;
  notas?: string;
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json());

  app.post('/api/analyze-workout', async (req, res) => {
    const body = (req.body || {}) as AnalyzeWorkoutBody;
    const { fecha, tipo, distancia_km, duracion_min, ritmo, notas } = body;

    if (
      typeof distancia_km !== 'number' ||
      !Number.isFinite(distancia_km) ||
      distancia_km <= 0 ||
      typeof duracion_min !== 'number' ||
      !Number.isFinite(duracion_min) ||
      duracion_min <= 0
    ) {
      res.status(400).json({
        error: 'Ingresa una distancia y duración válidas mayores a 0 para analizar la sesión.',
      });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({
        error:
          'No se encontró la clave GEMINI_API_KEY en el servidor. Configúrala en Settings > Secrets para activar el análisis con IA.',
      });
      return;
    }

    const prompt = [
      `Fecha: ${fecha || 'Hoy'}`,
      `Tipo: ${tipo || 'Correr'}`,
      `Distancia: ${distancia_km.toFixed(2)} km`,
      `Duración: ${duracion_min} min`,
      `Ritmo promedio: ${ritmo || 'No calculado'} min/km`,
      `Notas del atleta: ${notas && notas.trim() ? notas.trim() : 'Sin notas adicionales'}`,
    ].join('\n');

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Analiza esta sesión de entrenamiento:\n${prompt}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'Eres un entrenador de running y resistencia deportiva directo y práctico. Analiza la sesión registrada (tipo, distancia, duración, ritmo en min/km y notas) y responde en español en 2 o 3 frases breves como máximo: primero una lectura clara del esfuerzo o ritmo alcanzado, y luego una recomendación práctica de recuperación o progresión para la siguiente sesión. Sin saludos, sin viñetas ni emojis.',
        },
      });

      const analysisText = response.text?.trim();
      if (!analysisText) {
        res.status(502).json({
          error: 'Gemini no devolvió texto de análisis. Intenta nuevamente.',
        });
        return;
      }

      res.json({ analisis: analysisText });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido al consultar Gemini.';
      console.error('Error en /api/analyze-workout:', message);
      res.status(500).json({
        error: 'No se pudo completar el análisis con Gemini. Verifica tu conexión o clave de API e intenta de nuevo.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RunTracker Sheets server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
