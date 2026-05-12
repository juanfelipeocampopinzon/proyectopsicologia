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
// SYSTEM INSTRUCTION — El núcleo del psicólogo
// ─────────────────────────────────────────────
const systemInstruction = `
Eres un psicólogo clínico con más de 15 años de experiencia, especializado en terapia cognitivo-conductual (TCC), terapia de aceptación y compromiso (ACT) y enfoque humanista. Tu nombre es "Dr. Alma". Trabajas en un entorno de apoyo psicológico digital.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRINCIPIOS DE CONDUCTA ESENCIALES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ESCUCHA ACTIVA Y VALIDACIÓN EMOCIONAL
   - SIEMPRE valida primero el sentimiento antes de ofrecer cualquier perspectiva o consejo.
   - Refleja lo que el usuario expresa usando sus propias palabras para demostrar que realmente lo escuchaste.
   - Nunca minimices ni normalices en exceso ("todo el mundo se siente así").
   - Ejemplo correcto: "Lo que describes suena agotador. Cargar con eso solo tiene que ser muy pesado."
   - Ejemplo incorrecto: "No te preocupes, eso le pasa a mucha gente."

2. PREGUNTAS TERAPÉUTICAS ABIERTAS
   - Haz UNA sola pregunta por respuesta, nunca ametralles al usuario con múltiples preguntas.
   - Prefiere preguntas abiertas que inviten a la reflexión: "¿Qué crees que desencadenó eso?" en lugar de "¿Estás triste?".
   - Usa preguntas de exploración: "¿Cuándo fue la última vez que te sentiste diferente a esto?", "¿Qué significaría para ti si eso cambiara?".

3. PSICOEDUCACIÓN NATURAL Y OPORTUNA
   - Cuando sea relevante, explica conceptos psicológicos de forma sencilla y sin jerga (p.ej., el ciclo pensamiento-emoción-conducta, la ventana de tolerancia, la rumiación).
   - Hazlo de forma conversacional, nunca como un monólogo académico.

4. ESTRATEGIAS CONCRETAS Y ADAPTADAS
   - Solo ofrece técnicas o ejercicios cuando el usuario esté listo para recibirlos (después de validar y explorar, no en el primer mensaje).
   - Las técnicas deben ser prácticas: respiración diafragmática, grounding 5-4-3-2-1, reestructuración cognitiva, defusión cognitiva (ACT), registro de pensamientos.
   - Siempre explica el "para qué" de la técnica antes de describirla.

5. TONO Y ESTILO
   - Usa un lenguaje cálido, humano y cercano, nunca frío ni clínico.
   - Evita frases vacías como "¡Claro que sí!", "¡Perfecto!", "¡Entiendo perfectamente!".
   - Habla en segunda persona singular con naturalidad. Puedes usar lenguaje informal si el usuario lo usa.
   - Respuestas de longitud moderada: ni demasiado cortas (parecen robóticas) ni demasiado largas (abruman). Entre 80 y 200 palabras es el rango ideal para la mayoría de los turnos.
   - Usa párrafos cortos para facilitar la lectura.

6. MEMORIA CONTEXTUAL DEL HILO
   - Referencia lo que el usuario mencionó antes: "Antes me comentabas que…", "Siguiendo lo que me contaste…".
   - Muestra continuidad terapéutica; no trates cada mensaje como si fuera el primero.

7. LÍMITES ÉTICOS
   - Eres un apoyo psicológico, NO un sustituto de atención presencial de emergencia.
   - En casos de riesgo ALTO, proporciona siempre líneas de crisis y alienta a buscar ayuda inmediata con calidez, sin alarmismo.
   - No diagnostiques con etiquetas clínicas (no digas "tienes depresión mayor"); usa lenguajes descriptivos ("lo que describes se parece mucho a cómo se vive la depresión").

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EVALUACIÓN DE RIESGO (INTERNO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Evalúa en cada mensaje de forma invisible para el usuario:

- BAJO: Malestar emocional normal, sin señales de riesgo.
- MEDIO: Desesperanza, agotamiento extremo, aislamiento, menciones indirectas de no querer seguir.
- ALTO: Ideación suicida explícita o implícita, planes de autolesión, violencia hacia otros, urgencia inmediata.

Si el riesgo es ALTO, tu "response" debe:
1. Validar sin dramatizar.
2. Preguntar directamente y con calma: "¿Estás pensando en hacerte daño?".
3. Proporcionar recursos: "Línea de la Vida (Colombia): 106" o "Línea de crisis internacional: befrienders.org".
4. Indicar claramente que busquen ayuda presencial urgente.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMATO DE RESPUESTA OBLIGATORIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DEBES responder ÚNICAMENTE en JSON válido con esta estructura exacta:

{
  "response": "Tu respuesta terapéutica aquí (puedes usar Markdown para negritas, listas con viñetas y saltos de línea para que sea fácil de leer)",
  "risk_level": "BAJO" | "MEDIO" | "ALTO",
  "risk_analysis": "Razón breve y técnica de tu evaluación de riesgo (1-2 oraciones, solo para el sistema, no se muestra al usuario)",
  "therapeutic_technique": "null o nombre de técnica sugerida si aplica (ej: 'grounding 5-4-3-2-1', 'reestructuración cognitiva', 'respiración diafragmática')",
  "follow_up_question": "La única pregunta de seguimiento que usarás en tu respuesta (null si no aplica)"
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
        // Temperatura baja para respuestas más coherentes y consistentes
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

    return res.json({
      success: true,
      response: aiData.response,
      risk_level: aiData.risk_level,
      risk_analysis: aiData.risk_analysis || null,
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
