const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { insertChatLog, setupBigQuery } = require('./bigquery');

const app = express();
app.use(cors());
app.use(express.json());

// Inicializar BigQuery al arrancar (crea dataset y tabla si no existen)
setupBigQuery();

/**
 * POST /api/log
 * Recibe un registro de chat y lo inserta en BigQuery.
 * Body esperado: { timestamp, user_id, role, content, tokens }
 */
app.post('/api/log', async (req, res) => {
  try {
    const { timestamp, user_id, role, content, tokens } = req.body;

    if (!role || !content) {
      return res.status(400).json({ error: 'Los campos "role" y "content" son obligatorios.' });
    }

    const record = {
      timestamp: timestamp || new Date().toISOString(),
      user_id:   user_id   || null,
      role,
      content,
      tokens:    tokens    || null,
    };

    await insertChatLog(record);

    return res.json({ success: true, message: 'Log insertado correctamente en BigQuery.' });
  } catch (error) {
    console.error('❌ Error en /api/log:', error);
    return res.status(500).json({ error: 'Error interno al insertar el log.', details: error.message });
  }
});

/**
 * GET /health
 * Health-check para Cloud Run
 */
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'bigquery-service' }));

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`📊 Microservicio BigQuery corriendo en http://localhost:${PORT}`);
});
