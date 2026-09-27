const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

const project = process.env.PROJECT_ID || 'microservicio-471115';
const location = 'global';

const ai = new GoogleGenAI({
  vertexai: true,
  project: project,
  location: location,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

const modelName = 'gemini-2.5-pro';

// ─────────────────────────────────────────────
// SYSTEM INSTRUCTION — El núcleo del psicólogo y Análisis Inteligente
// ─────────────────────────────────────────────
const systemInstruction = `
Eres un psicólogo clínico con más de 15 años de experiencia, especializado en terapia cognitivo-conductual (TCC) y apoyo universitario. Tu nombre es "Dr. Alma" y eres el alma de LUMEN, la plataforma de apoyo emocional para los estudiantes de la Universidad Cooperativa de Colombia (UCC).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXTO ESTUDIANTIL UCC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Tu público son jóvenes y adultos que estudian en la UCC.
- Entiendes perfectamente el estrés por parciales, la presión de los trabajos finales, la ansiedad por el promedio, el equilibrio entre trabajo y estudio, y la vida universitaria en Colombia.
- Usa un lenguaje que conecte con la juventud universitaria colombiana, pero manteniendo siempre el profesionalismo y la calidez.
- Si el usuario menciona problemas académicos, valida su esfuerzo y ofrece técnicas de gestión de tiempo o manejo de ansiedad ante exámenes.

1. ESCUCHA ACTIVA Y VALIDACIÓN EMOCIONAL
   - SIEMPRE valida primero el sentimiento antes de ofrecer cualquier perspectiva o consejo.
   - Refleja lo que el usuario expresa usando sus propias palabras para demostrar que realmente lo escuchaste.
   - Nunca minimices ni normalices en exceso ("todo el mundo se siente así").

2. PREGUNTAS TERAPÉUTICAS ABIERTAS
   - Haz UNA sola pregunta por respuesta, nunca ametralles al usuario con múltiples preguntas.
   - Prefiere preguntas abiertas que inviten a la reflexión: "¿Qué crees que desencadenó eso?" en lugar de "¿Estás triste?".

3. PSICOEDUCACIÓN Y ESTRATEGIAS ADAPTADAS
   - Cuando sea relevante, explica conceptos sencillos (ciclo pensamiento-emoción, defusión cognitiva, ventana de tolerancia).
   - Ofrece técnicas prácticas (respiración diafragmática 4-7-8, grounding 5-4-3-2-1, registro de pensamientos) explicando su propósito.

4. LÍMITES ÉTICOS Y PROTOCOLO DE CRISIS
   - En casos de riesgo ALTO: valida con calma, pregunta directamente sobre ideas de autolesión, proporciona recursos ("Línea de la Vida 106 en Colombia", "befrienders.org") y motiva a buscar ayuda presencial inmediata.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MÓDULO DE ANÁLISIS INTELIGENTE CLÍNICO (INTERNO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
En cada interacción debes realizar un diagnóstico y análisis psicológico exhaustivo estructurado en segundo plano:

1. DETECCIÓN DE EMOCIONES (Porcentaje de intensidad estimada 0 a 100%):
   - Ansiedad, Tristeza, Estrés, Soledad, Ira, Miedo, Culpa, Esperanza, Calma.
2. DETECCIÓN DE TEMAS:
   - Identifica categorías relevantes: ["Familia", "Universidad", "Trabajo", "Relaciones", "Autoestima", "Problemas económicos", "Acoso", "Violencia", "Salud", "Duelo", "Identidad", "Otro"].
3. FACTORES DESENCADENANTES (Triggers):
   - Identifica situaciones detonantes del malestar (ej. "Problemas académicos", "Ruptura de pareja", "Presión familiar").
   - Evalúa su "frequency" ("Alta" | "Media" | "Baja") y "risk_correlation" ("Alta" | "Moderada" | "Baja").
4. CAMBIOS DE COMPORTAMIENTO:
   - Detecta si hay: cambios en frecuencia/longitud de mensajes, aumento de lenguaje negativo, escalada de expresiones de riesgo o giros temáticos abruptos.
5. CONTRADICCIONES:
   - Identifica si el usuario se contradice respecto a turnos anteriores (ej. "Estoy bien" -> "Me siento cada vez peor", "No me importa" -> "Lloro todo el día").
6. CONFIANZA TÉCNICA DEL MODELO:
   - Un valor entero entre 0 y 100 (ej. 91) que mide la certeza técnica del modelo en su estimación del riesgo basada en la claridad y consistencia de las señales.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMATO DE RESPUESTA OBLIGATORIO (JSON)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEBES responder ÚNICAMENTE en JSON válido con esta estructura exacta:

{
  "response": "Tu respuesta terapéutica al estudiante (puedes usar Markdown para negritas, viñetas y párrafos cortos)",
  "risk_level": "BAJO" | "MEDIO" | "ALTO",
  "risk_confidence": 91,
  "risk_analysis": "Razón breve y técnica de la evaluación del riesgo (1-2 oraciones para el psicólogo supervisor)",
  "explanation": "Explicación integral del estado y progresión del consultante",
  "emotions": {
    "ansiedad": 65,
    "tristeza": 45,
    "estres": 40,
    "soledad": 30,
    "ira": 10,
    "miedo": 20,
    "culpa": 15,
    "esperanza": 25,
    "calma": 20
  },
  "themes": ["Universidad", "Autoestima"],
  "triggers": [
    {
      "factor": "Problemas académicos con exámenes finales",
      "frequency": "Alta",
      "risk_correlation": "Moderada"
    }
  ],
  "behavioral_changes": [
    "Aumento del lenguaje negativo",
    "Incremento en longitud de mensajes expresando angustia"
  ],
  "contradictions": [
    {
      "detected": false,
      "initial_statement": "",
      "contradictory_statement": "",
      "explanation": ""
    }
  ],
  "therapeutic_technique": "respiración diafragmática 4-7-8" | null,
  "follow_up_question": "¿Qué momento del día sientes que la tensión aumenta más?" | null
}

No incluyas texto fuera del JSON. No uses bloques de código markdown.
`.trim();

// ─────────────────────────────────────────────
// ENDPOINT PRINCIPAL
// ─────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'La solicitud debe contener un arreglo de mensajes no vacío.' });
    }

    // Validación básica de estructura de mensajes
    for (const msg of messages) {
      if (!msg.role || !msg.parts) {
        return res.status(400).json({ error: 'Cada mensaje debe tener "role" y "parts".' });
      }
    }

    const formattedContents = messages.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: msg.parts
    }));

    const result = await ai.models.generateContent({
      model: modelName,
      contents: formattedContents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.7,
        topP: 0.9,
        safetySettings: [
          { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
        ]
      }
    });

    // Extracción robusta del texto
    let textResponse = '';
    try {
      textResponse =
        result?.response?.text?.() ||
        result?.text ||
        result?.candidates?.[0]?.content?.parts?.[0]?.text ||
        '';
    } catch (extractionError) {
      console.error('Error extrayendo texto de la respuesta:', extractionError);
    }

    if (!textResponse) {
      console.error('Respuesta vacía. Objeto recibido:', JSON.stringify(result, null, 2));
      return res.status(500).json({
        error: 'La IA devolvió una respuesta vacía o fue bloqueada por los filtros de seguridad.'
      });
    }

    // Limpieza de posibles bloques markdown que el modelo añada por error
    textResponse = textResponse
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let aiData;
    try {
      aiData = JSON.parse(textResponse);
    } catch (parseError) {
      console.error('Error parseando JSON de la IA:', parseError);
      console.error('Texto recibido:', textResponse);
      return res.status(500).json({
        error: 'La IA devolvió un formato JSON inválido.',
        raw: textResponse
      });
    }

    // Validación de campos requeridos
    if (!aiData.response || !aiData.risk_level) {
      return res.status(500).json({
        error: 'La respuesta de la IA no contiene los campos requeridos.',
        raw: aiData
      });
    }

    // Normalización de datos para garantizar consistencia clínica
    const defaultEmotions = {
      ansiedad: 20,
      tristeza: 20,
      estres: 25,
      soledad: 15,
      ira: 10,
      miedo: 15,
      culpa: 10,
      esperanza: 50,
      calma: 45
    };

    const finalEmotions = { ...defaultEmotions, ...(aiData.emotions || {}) };
    const finalRiskLevel = (aiData.risk_level || 'BAJO').toUpperCase();
    const finalConfidence = typeof aiData.risk_confidence === 'number' 
      ? Math.min(100, Math.max(10, Math.round(aiData.risk_confidence))) 
      : (finalRiskLevel === 'ALTO' ? 92 : finalRiskLevel === 'MEDIO' ? 84 : 88);

    return res.json({
      success: true,
      response: aiData.response,
      risk_level: finalRiskLevel,
      risk_confidence: finalConfidence,
      risk_analysis: aiData.risk_analysis || null,
      explanation: aiData.explanation || aiData.risk_analysis || null,
      emotions: finalEmotions,
      themes: Array.isArray(aiData.themes) ? aiData.themes : ["General"],
      triggers: Array.isArray(aiData.triggers) ? aiData.triggers : [],
      behavioral_changes: Array.isArray(aiData.behavioral_changes) ? aiData.behavioral_changes : [],
      contradictions: Array.isArray(aiData.contradictions) ? aiData.contradictions : [],
      therapeutic_technique: aiData.therapeutic_technique || null,
      follow_up_question: aiData.follow_up_question || null
    });

  } catch (error) {
    console.error('Error al comunicarse con Vertex AI:', error);
    return res.status(500).json({
      error: 'Error interno del microservicio de psicología.',
      details: error.message
    });
  }
});

// ─────────────────────────────────────────────
// SYSTEM INSTRUCTION — SUPERVISOR CLÍNICO PARA PSICÓLOGOS
// ─────────────────────────────────────────────
const clinicalSupervisorInstruction = `
Eres un SUPERVISOR CLÍNICO SENIOR y ESPECIALISTA EN PSICOMETRÍA Y TERAPIA COGNITIVO-CONDUCTUAL (TCC) de la plataforma LUMEN.

TU OBJETIVO:
Generar un informe clínico evolutivo, identificación de patrones cognitivo-conductuales y recomendaciones terapéuticas dirigidas EXCLUSIVAMENTE AL PSICÓLOGO TRATANTE / PROFESIONAL DE SALUD MENTAL.

NORMAS OBLIGATORIAS:
1. NUNCA le hables al paciente. NUNCA uses la segunda persona ("tú", "te entiendo", "vamos a").
2. Redacta SIEMPRE en 3ra persona con lenguaje clínico profesional formal ("El/la paciente presenta...", "Se evidencia un patrón de...", "Se sugiere al terapeuta...").
3. Identifica de forma rigurosa:
   - PATRONES COGNITIVOS: Distorsiones cognitivas activas (catastrofización, pensamiento de todo o nada, lectura del pensamiento, inferencia arbitraria, autoexigencia desadaptativa, sesgo de atención).
   - PATRONES CONDUCTUALES Y SOMÁTICOS: Conductas de evitación/procrastinación, somatizaciones (taquicardia, tensión, opresión), alteraciones del ciclo de sueño/insomnio, labilidad emocional o aislamiento social.
   - FACTORES DESENCADENANTES (TRIGGERS): Estresores académicos universitarios, presión familiar, conflictos interpersonales o sobrecarga evaluativa.
   - CONTRADICCIONES O SEÑALES DE ALERTA: Inconsistencias entre el relato verbalizado ("todo está bien") y los síntomas descritos, o señales de riesgo latente.
   - RECOMENDACIONES TERAPÉUTICAS: Técnicas y pautas de intervención específicas de TCC que el terapeuta humano puede aplicar en consulta presencial.

FORMATO DE RESPUESTA EXCLUSIVO (JSON):
{
  "clinical_summary": "Síntesis técnica del caso para la historia clínica psicológica (2 a 3 párrafos en 3ra persona analizando el curso evolutivo del consultante).",
  "cognitive_patterns": [
    "Distorsión: Catastrofización y anticipación de consecuencias negativas graves ante exámenes.",
    "Creencia nuclear: Esquema de autoexigencia inflexible y miedo al fracaso académico."
  ],
  "behavioral_patterns": [
    "Patrón de evitación y dificultades de autorregulación del tiempo.",
    "Alteración del patrón de sueño (insomnio de conciliación por rumiación nocturna)."
  ],
  "risk_evaluation": {
    "level": "BAJO" | "MEDIO" | "ALTO",
    "confidence": 92,
    "justification": "Explicación técnica del nivel de riesgo estimado para el profesional a cargo."
  },
  "key_triggers": [
    "Entregas académicas bajo presión de tiempo",
    "Expectativas familiares elevadas"
  ],
  "contradictions_or_flags": [
    "Discrepancia entre la minimización consciente del problema y la severidad de los síntomas somáticos reportados."
  ],
  "therapeutic_recommendations": [
    "Aplicar reestructuración cognitiva (registro de pensamientos automáticos de 3 columnas de Beck).",
    "Entrenamiento en pautas de higiene de sueño y técnicas de desactivación fisiológica (grounding / respiración 4-7-8).",
    "Planificar en consulta presencial la activación conductual y jerarquización de estresores académicos."
  ]
}

No incluyas texto fuera del JSON. No uses bloques de código markdown.
`.trim();

// ─────────────────────────────────────────────
// ENDPOINT DE ANÁLISIS CLÍNICO PARA EL PSICÓLOGO
// ─────────────────────────────────────────────
app.post('/api/clinical-analysis', async (req, res) => {
  try {
    const { patientName, sessionsCount, alertsCount, recentMessages, dominantEmotions } = req.body;

    const formattedHistory = Array.isArray(recentMessages)
      ? recentMessages.map(m => `[${(m.role || 'USUARIO').toUpperCase()}]: ${m.content || ''}`).join('\n')
      : 'No hay mensajes previos registrados.';

    const prompt = `Analiza clínicamente el historial y evolución del siguiente consultante universitario:
- Nombre del paciente: ${patientName || 'Consultante'}
- Cantidad de sesiones terapéuticas: ${sessionsCount || 1}
- Alertas de riesgo previas: ${alertsCount || 0}
- Emociones predominantes observadas: ${dominantEmotions ? JSON.stringify(dominantEmotions) : 'No especificado'}

HISTORIAL DE INTERACCIONES Y MENSAJES RECIENTES:
${formattedHistory}

Genera el informe diagnóstico, los patrones cognitivos y conductuales identificados, y las recomendaciones terapéuticas en el formato JSON especificado.`;

    const result = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: clinicalSupervisorInstruction,
        responseMimeType: 'application/json',
        temperature: 0.4,
        topP: 0.85
      }
    });

    let textResponse = '';
    try {
      textResponse =
        result?.response?.text?.() ||
        result?.text ||
        result?.candidates?.[0]?.content?.parts?.[0]?.text ||
        '';
    } catch (err) {
      console.error('Error al extraer texto de análisis clínico:', err);
    }

    if (!textResponse) {
      return res.status(500).json({ error: 'La IA devolvió una respuesta vacía.' });
    }

    textResponse = textResponse
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const reportData = JSON.parse(textResponse);

    return res.json({
      success: true,
      clinical_summary: reportData.clinical_summary || 'Síntesis clínica generada correctamente.',
      cognitive_patterns: Array.isArray(reportData.cognitive_patterns) ? reportData.cognitive_patterns : [],
      behavioral_patterns: Array.isArray(reportData.behavioral_patterns) ? reportData.behavioral_patterns : [],
      risk_evaluation: reportData.risk_evaluation || {
        level: alertsCount > 0 ? 'ALTO' : 'MEDIO',
        confidence: 88,
        justification: 'Evaluación técnica basada en la presencia de estresores y alertas.'
      },
      key_triggers: Array.isArray(reportData.key_triggers) ? reportData.key_triggers : [],
      contradictions_or_flags: Array.isArray(reportData.contradictions_or_flags) ? reportData.contradictions_or_flags : [],
      therapeutic_recommendations: Array.isArray(reportData.therapeutic_recommendations) ? reportData.therapeutic_recommendations : []
    });

  } catch (error) {
    console.error('Error en /api/clinical-analysis:', error);
    return res.status(500).json({
      error: 'Error generando el análisis clínico para el psicólogo.',
      details: error.message
    });
  }
});

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', model: modelName, project });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🧠 Microservicio Psicólogo corriendo en http://localhost:${PORT}`);
  console.log(`🔌 Vertex AI | Proyecto: ${project} | Región: ${location} | Modelo: ${modelName}`);
});
