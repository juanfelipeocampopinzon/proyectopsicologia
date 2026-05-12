"use server";

export async function logToBigQuery(data: any) {
  const bigqueryUrl = process.env.NEXT_PUBLIC_BIGQUERY_API_URL || process.env.BIGQUERY_API_URL || 'http://localhost:8081';
  try {
    const response = await fetch(`${bigqueryUrl}/api/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Error en BigQuery: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error logging to BigQuery from server action:", error);
    return null;
  }
}

export async function chatWithGemini(messages: any[]) {
  const geminiUrl = process.env.NEXT_PUBLIC_GEMINI_API_URL || process.env.GEMINI_API_URL || 'http://localhost:8080';
  try {
    const response = await fetch(`${geminiUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages })
    });
    
    if (!response.ok) {
      throw new Error(`Error en Gemini: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error communicating with Gemini from server action:", error);
    return { 
      response: "Lo siento, tuve un problema interno de comunicación. ¿Podrías intentar enviar tu mensaje nuevamente?", 
      risk_level: "BAJO",
      risk_analysis: "Error de conexión con el servicio."
    };
  }
}
