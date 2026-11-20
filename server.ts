import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

interface AnalyzeExpenseBody {
  fecha?: string;
  categoria?: string;
  monto?: number;
  metodo_pago?: string;
  notas?: string;
  monthlySpent?: number;
  monthlyBudget?: number;
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

  app.post('/api/analyze-expense', async (req, res) => {
    const body = (req.body || {}) as AnalyzeExpenseBody;
    const {
      fecha,
      categoria,
      monto,
      metodo_pago,
      notas,
      monthlySpent = 0,
      monthlyBudget = 0,
    } = body;

    if (typeof monto !== 'number' || !Number.isFinite(monto) || monto <= 0) {
      res.status(400).json({
        error: 'Ingresa un monto válido mayor a 0 para analizar el gasto.',
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

    const budgetRatio =
      monthlyBudget > 0 ? `${((monto / monthlyBudget) * 100).toFixed(1)}%` : 'Sin presupuesto configurado';
    const accumulatedAfter = monthlySpent + monto;

    const prompt = [
      `Fecha: ${fecha || 'Hoy'}`,
      `Categoría: ${categoria || 'Comida'}`,
      `Monto del gasto: $${monto.toFixed(2)}`,
      `Método de pago: ${metodo_pago || 'Tarjeta'}`,
      `Notas: ${notas && notas.trim() ? notas.trim() : 'Sin notas adicionales'}`,
      `Contexto mensual: Gastado previo $${monthlySpent.toFixed(2)}, nuevo acumulado $${accumulatedAfter.toFixed(2)}, presupuesto mensual $${monthlyBudget.toFixed(2)} (este gasto representa ${budgetRatio} del presupuesto).`,
    ].join('\n');

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Analiza este gasto personal:\n${prompt}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'Eres un asesor de finanzas personales práctico y directo. Analiza el gasto registrado junto al presupuesto mensual acumulado y responde en español en máximo 2 o 3 frases breves: primero evalúa el impacto real de este gasto en el mes, y luego da una recomendación concreta y accionable para equilibrar los próximos días. Sin saludos, sin viñetas ni emojis.',
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
      console.error('Error en /api/analyze-expense:', message);
      res.status(500).json({
        error:
          'No se pudo completar el análisis con Gemini. Verifica tu conexión o clave de API e intenta de nuevo.',
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
    console.log(`GastoFlash Sheets server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
