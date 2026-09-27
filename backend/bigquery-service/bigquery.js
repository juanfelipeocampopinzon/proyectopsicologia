const { BigQuery } = require('@google-cloud/bigquery');
require('dotenv').config();

const projectId = process.env.PROJECT_ID || 'microservicio-471115';
const datasetId = process.env.DATASET_ID || process.env.BQ_DATASET || 'psicologia_analytics';
const tableId = process.env.TABLE_ID || process.env.BQ_TABLE || 'chat_logs';

const bigquery = new BigQuery({
  projectId: projectId,
});

/**
 * Inserta un log de chat en BigQuery
 * @param {Object} data - Datos a insertar
 */
async function insertChatLog(data) {
  try {
    await bigquery
      .dataset(datasetId)
      .table(tableId)
      .insert([data]);
    console.log(`✅ Log insertado en BigQuery: ${datasetId}.${tableId}`);
  } catch (error) {
    if (error.name === 'PartialFailureError') {
      console.error('❌ Error parcial al insertar en BigQuery:', JSON.stringify(error.errors, null, 2));
    } else {
      console.error('❌ Error al insertar en BigQuery:', error);
    }
  }
}

/**
 * Crea el dataset y la tabla si no existen
 */
async function setupBigQuery() {
  try {
    // Verificar/Crear Dataset
    const [datasets] = await bigquery.getDatasets();
    if (!datasets.some(d => d.id === datasetId)) {
      await bigquery.createDataset(datasetId);
      console.log(`📦 Dataset ${datasetId} creado.`);
    }

    // Verificar/Crear Tabla
    const dataset = bigquery.dataset(datasetId);
    const [tables] = await dataset.getTables();
    if (!tables.some(t => t.id === tableId)) {
      const schema = [
        { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
        { name: 'user_id',   type: 'STRING',    mode: 'NULLABLE' },
        { name: 'role',      type: 'STRING',    mode: 'REQUIRED' },
        { name: 'content',   type: 'STRING',    mode: 'REQUIRED' },
        { name: 'tokens',    type: 'INTEGER',   mode: 'NULLABLE' }
      ];
      await dataset.createTable(tableId, { schema });
      console.log(`📊 Tabla ${tableId} creada en ${datasetId}.`);
    }
  } catch (error) {
    console.error('❌ Error configurando BigQuery:', error);
  }
}

/**
 * Ejecuta una consulta SQL en BigQuery
 * @param {string} query - Consulta SQL
 */
async function executeQuery(query) {
  try {
    const options = {
      query: query,
      location: 'US', // O la ubicación de tu dataset
    };
    const [rows] = await bigquery.query(options);
    return rows;
  } catch (error) {
    console.error('❌ Error ejecutando consulta en BigQuery:', error);
    throw error;
  }
}

module.exports = { insertChatLog, setupBigQuery, executeQuery };
