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

// Instanciamos usando el modo vertexai con la nueva SDK
const ai = new GoogleGenAI({ vertexai: true, project: project, location: location });
const modelName = 'gemini-2.5-pro';

const systemInstruction = "Eres un psicólogo profesional, empático y experto. Debes escuchar al usuario, validar sus emociones, ser ético y ofrecer reflexiones constructivas desde la terapia cognitivo-conductual. Nunca diagnostiques graves trastornos mentales por chat, recomienda un profesional en persona si es necesario. Tu tono es comprensivo y calmado.";

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'La solicitud debe contener un arreglo de mensajes' });
    }

    // Adaptamos el formato de Next.js al formato que requiere Google Gen AI
    const formattedContents = messages.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: msg.parts // Asume un arreglo con [{ text: "..." }]
    }));

    const response = await ai.models.generateContent({
      model: modelName,
      contents: formattedContents,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    const botResponse = response.text;

    return res.json({
      success: true,
      response: botResponse
    });

  } catch (error) {
    console.error("Error al comunicarse con Vertex AI:", error);
    return res.status(500).json({ error: 'Error interno del servidor en el bot de psicología', details: error.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🧠 Microservicio Gemini Psicólogo corriendo en http://localhost:${PORT}`);
  console.log(`🔌 Conectado a Vertex AI Project: ${project} en ${location} usando Google Gen AI SDK`);
});
