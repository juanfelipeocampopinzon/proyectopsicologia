const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Usamos la nueva librería oficial unificada Google Gen AI SDK
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

const project = process.env.PROJECT_ID || 'microservicio-471115';
// Google confirmó en 2026 que Gemini 1.5 es "legacy" cerrando acceso a nuevos proyectos.
// Gemini 2.5 Pro se debe acceder usando la región "global"
const location = 'global';

// Instanciamos usando el modo vertexai con la nueva SDK y pasamos la ruta de las credenciales
const ai = new GoogleGenAI({ 
  vertexai: true, 
  project: project, 
  location: location,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS // Usar la ruta del .env
});
const modelName = 'gemini-2.5-pro';

const systemInstruction = `Eres un psicólogo profesional, empático y experto. 
Tu tarea es doble: 
1. Responder al usuario de forma empática.
2. Evaluar el riesgo de seguridad (ideación suicida, autolesiones, violencia).

DEBES RESPONDER ÚNICAMENTE EN FORMATO JSON con la siguiente estructura:
{
  "response": "tu respuesta empática aquí",
  "risk_level": "BAJO" | "MEDIO" | "ALTO",
  "risk_analysis": "breve razón de la evaluación de riesgo"
}`;

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'La solicitud debe contener un arreglo de mensajes' });
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
        responseMimeType: "application/json",
        safetySettings: [
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
        ]
      }
    });

    // Extracción ultra-segura del texto
    let textResponse = "";
    try {
      // Intentamos todas las rutas posibles del objeto de respuesta
      textResponse = result.response?.text?.() || 
                     result.text || 
                     result.candidates?.[0]?.content?.parts?.[0]?.text || 
                     "";
    } catch (e) {
      console.log("Error al extraer texto directamente, revisando objeto...");
    }

    if (!textResponse) {
      console.error("Respuesta vacía o bloqueada por seguridad. Objeto recibido:", JSON.stringify(result, null, 2));
      return res.status(500).json({ error: "La IA bloqueó el mensaje por seguridad o devolvió un formato vacío." });
    }

    textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiData = JSON.parse(textResponse);

    return res.json({
      success: true,
      response: aiData.response,
      risk_level: aiData.risk_level,
      risk_analysis: aiData.risk_analysis
    });

  } catch (error) {
    console.error("Error al comunicarse con Vertex AI:", error);
    return res.status(500).json({ error: 'Error en el bot de psicología', details: error.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🧠 Microservicio Gemini Psicólogo corriendo en http://localhost:${PORT}`);
  console.log(`🔌 Conectado a Vertex AI Project: ${project} en ${location} usando Google Gen AI SDK`);
});
