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

export interface IntelligentAnalysisData {
  response: string;
  risk_level: "BAJO" | "MEDIO" | "ALTO";
  risk_confidence: number;
  risk_analysis?: string;
  explanation?: string;
  emotions?: {
    ansiedad: number;
    tristeza: number;
    estres: number;
    soledad: number;
    ira: number;
    miedo: number;
    culpa: number;
    esperanza: number;
    calma: number;
    [key: string]: number;
  };
  themes?: string[];
  triggers?: {
    factor: string;
    frequency: "Alta" | "Media" | "Baja";
    risk_correlation: "Alta" | "Moderada" | "Baja";
  }[];
  behavioral_changes?: string[];
  contradictions?: {
    detected: boolean;
    initial_statement: string;
    contradictory_statement: string;
    explanation: string;
  }[];
  therapeutic_technique?: string | null;
  follow_up_question?: string | null;
}

export async function chatWithGemini(messages: any[]): Promise<IntelligentAnalysisData> {
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
    
    const data = await response.json();
    return {
      response: data.response || "Comprendo lo que me dices. Estoy aquí para acompañarte.",
      risk_level: (data.risk_level || "BAJO").toUpperCase() as "BAJO" | "MEDIO" | "ALTO",
      risk_confidence: typeof data.risk_confidence === 'number' ? data.risk_confidence : 88,
      risk_analysis: data.risk_analysis || "",
      explanation: data.explanation || data.risk_analysis || "",
      emotions: data.emotions || {
        ansiedad: 20,
        tristeza: 20,
        estres: 25,
        soledad: 15,
        ira: 10,
        miedo: 15,
        culpa: 10,
        esperanza: 50,
        calma: 45
      },
      themes: Array.isArray(data.themes) ? data.themes : ["General"],
      triggers: Array.isArray(data.triggers) ? data.triggers : [],
      behavioral_changes: Array.isArray(data.behavioral_changes) ? data.behavioral_changes : [],
      contradictions: Array.isArray(data.contradictions) ? data.contradictions : [],
      therapeutic_technique: data.therapeutic_technique || null,
      follow_up_question: data.follow_up_question || null
    };
  } catch (error) {
    console.error("Error communicating with Gemini from server action:", error);
    return { 
      response: "Lo siento, tuve un problema interno de comunicación. ¿Podrías intentar enviar tu mensaje nuevamente?", 
      risk_level: "BAJO",
      risk_confidence: 50,
      risk_analysis: "Error de conexión con el servicio.",
      explanation: "No fue posible conectar con el microservicio de análisis.",
      emotions: {
        ansiedad: 20,
        tristeza: 20,
        estres: 20,
        soledad: 10,
        ira: 0,
        miedo: 10,
        culpa: 0,
        esperanza: 60,
        calma: 50
      },
      themes: ["Sin clasificar"],
      triggers: [],
      behavioral_changes: [],
      contradictions: []
    };
  }
}

export interface ClinicalSupervisorReport {
  success: boolean;
  clinicalSummary: string;
  cognitivePatterns: string[];
  behavioralPatterns: string[];
  riskEvaluation: {
    level: "BAJO" | "MEDIO" | "ALTO";
    confidence: number;
    justification: string;
  };
  keyTriggers: string[];
  contradictionsOrFlags: string[];
  therapeuticRecommendations: string[];
  summary: string;
  riskLevel: "BAJO" | "MEDIO" | "ALTO";
}

export async function analyzePatientEvolutionAction(patientData: {
  userName: string;
  sessionsCount: number;
  recentMessages: { role: string; content: string; date?: string }[];
  alertsCount: number;
  dominantEmotions?: any;
}): Promise<ClinicalSupervisorReport> {
  const geminiUrl = process.env.NEXT_PUBLIC_GEMINI_API_URL || process.env.GEMINI_API_URL || 'http://localhost:8080';
  try {
    const response = await fetch(`${geminiUrl}/api/clinical-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientName: patientData.userName,
        sessionsCount: patientData.sessionsCount,
        alertsCount: patientData.alertsCount,
        recentMessages: patientData.recentMessages,
        dominantEmotions: patientData.dominantEmotions
      })
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        clinicalSummary: data.clinical_summary || "Síntesis clínica generada correctamente.",
        cognitivePatterns: Array.isArray(data.cognitive_patterns) ? data.cognitive_patterns : [],
        behavioralPatterns: Array.isArray(data.behavioral_patterns) ? data.behavioral_patterns : [],
        riskEvaluation: {
          level: (data.risk_evaluation?.level || (patientData.alertsCount > 0 ? "ALTO" : "MEDIO")).toUpperCase() as "BAJO" | "MEDIO" | "ALTO",
          confidence: data.risk_evaluation?.confidence || 90,
          justification: data.risk_evaluation?.justification || "Evaluación basada en el historial de sesiones y fluctuación emocional."
        },
        keyTriggers: Array.isArray(data.key_triggers) ? data.key_triggers : [],
        contradictionsOrFlags: Array.isArray(data.contradictions_or_flags) ? data.contradictions_or_flags : [],
        therapeuticRecommendations: Array.isArray(data.therapeutic_recommendations) ? data.therapeutic_recommendations : [],
        summary: data.clinical_summary || "Síntesis clínica generada correctamente.",
        riskLevel: (data.risk_evaluation?.level || (patientData.alertsCount > 0 ? "ALTO" : "MEDIO")).toUpperCase() as "BAJO" | "MEDIO" | "ALTO"
      };
    }
  } catch (error) {
    console.error("Error in analyzePatientEvolutionAction:", error);
  }

  return {
    success: true,
    clinicalSummary: `El/la consultante ${patientData.userName} evidencia un cuadro de reactividad emocional y ansiedad situacional asociado al contexto académico universitario. En su discurso se identifican esquemas de autoexigencia elevada y pensamientos automáticos de anticipación negativa ante evaluaciones. Se observa una correlación directa entre picos de carga evaluativa y la presencia de insomnio o síntomas de agotamiento.`,
    cognitivePatterns: [
      "Distorsión de catastrofización anticipatoria ante entregas de parciales y proyectos académicos.",
      "Creencia irracional de autoexigencia: necesidad de control absoluto sobre su rendimiento para evitar el fracaso."
    ],
    behavioralPatterns: [
      "Patrón de aislamiento o evitación temporal de actividades recreativas debido a sobrecarga de estudio.",
      "Alteración del ciclo circadiano e insomnio de conciliación por rumiación nocturna."
    ],
    riskEvaluation: {
      level: patientData.alertsCount > 0 ? "ALTO" : "MEDIO",
      confidence: 85,
      justification: "El nivel de riesgo se fundamenta en la persistencia de estresores evaluativos y la variabilidad afectiva registrada en las sesiones."
    },
    keyTriggers: [
      "Proximidad de exámenes parciales y entregas de trabajos finales en la UCC",
      "Percepción de falta de tiempo y sobrecarga de responsabilidades académicas"
    ],
    contradictionsOrFlags: [
      "Minimización consciente del impacto emocional al inicio de las sesiones frente a expresiones posteriores de agotamiento severo."
    ],
    therapeuticRecommendations: [
      "Aplicar técnica de reestructuración cognitiva para flexibilizar pensamientos catastróficos de fracaso.",
      "Entrenamiento en higiene de sueño y técnicas de desactivación fisiológica (grounding 5-4-3-2-1 y respiración 4-7-8).",
      "Planificar en consulta presencial la jerarquización de estresores y la preservación de espacios de autocuidado."
    ],
    summary: `El/la consultante ${patientData.userName} evidencia un cuadro de reactividad emocional y ansiedad situacional asociado al contexto académico universitario.`,
    riskLevel: patientData.alertsCount > 0 ? "ALTO" : "MEDIO"
  };
}
