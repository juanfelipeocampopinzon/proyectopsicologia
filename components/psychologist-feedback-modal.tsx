"use client";

import { useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Stethoscope,
  ShieldAlert,
  Clock,
  Phone,
  ClipboardList,
  Check,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FeedbackTarget {
  analysisId?: string;
  alertId: string;
  sessionId: string;
  sessionTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  aiRisk: string;
  aiConfidence?: number;
  aiAnalysisText?: string;
  riskAnalysis?: string;
}

type ValidationType = "CORRECTO" | "INCORRECTO" | "SOBREESTIMADO" | "SUBESTIMADO";
type RiskLevel = "BAJO" | "MEDIO" | "ALTO";
type AlertStatus = "CONFIRMADA" | "FALSA_ALARMA" | "REQUIERE_SEGUIMIENTO" | "CASO_CERRADO";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  target: FeedbackTarget | null;
}

// ---------------------------------------------------------------------------
// Helper badge colours
// ---------------------------------------------------------------------------

const riskColor: Record<RiskLevel, string> = {
  BAJO: "bg-emerald-100 text-emerald-800 border-emerald-200",
  MEDIO: "bg-amber-100 text-amber-800 border-amber-200",
  ALTO: "bg-red-100 text-red-800 border-red-200",
};

const riskBg: Record<RiskLevel, string> = {
  BAJO: "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40",
  MEDIO: "border-amber-300 bg-amber-50 dark:bg-amber-950/40",
  ALTO: "border-red-300 bg-red-50 dark:bg-red-950/40",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PsychologistFeedbackModal({ isOpen, onClose, target }: Props) {
  const [validationType, setValidationType] = useState<ValidationType | null>(null);
  const [psychologistRisk, setPsychologistRisk] = useState<RiskLevel | null>(null);
  const [alertStatus, setAlertStatus] = useState<AlertStatus | null>(null);
  const [professionalDecision, setProfessionalDecision] = useState<string>("");
  const [correctionReason, setCorrectionReason] = useState<string>("");
  const [comments, setComments] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isOpen || !target) return null;

  const aiRisk = (target.aiRisk || "BAJO").toUpperCase() as RiskLevel;

  const handleSave = async () => {
    if (!validationType || !psychologistRisk || !alertStatus) return;
    setSaving(true);
    try {
      const user = auth.currentUser;
      await addDoc(collection(db, "psychologist_feedback"), {
        alertId: target.alertId,
        sessionId: target.sessionId,
        sessionTitle: target.sessionTitle,
        userId: target.userId,
        userName: target.userName,
        userEmail: target.userEmail,
        psychologistId: user?.uid || "desconocido",
        psychologistName: user?.displayName || "Psicólogo",
        aiRisk,
        aiConfidence: target.aiConfidence ?? null,
        aiAnalysisText: target.riskAnalysis || "",
        psychologistRisk,
        isCorrect: validationType === "CORRECTO",
        validationType,
        alertStatus,
        professionalDecision,
        correctionReason,
        comments,
        createdAt: serverTimestamp(),
      });

      // Update alert with validation status
      await updateDoc(doc(db, "emergency_alerts", target.alertId), {
        validationStatus: psychologistRisk,
        validationType,
        alertStatus,
      });

      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
        setValidationType(null);
        setPsychologistRisk(null);
        setAlertStatus(null);
        setProfessionalDecision("");
        setCorrectionReason("");
        setComments("");
      }, 1500);
    } catch (err) {
      console.error("Error al guardar retroalimentación:", err);
    } finally {
      setSaving(false);
    }
  };

  const validationOptions: { id: ValidationType; label: string; desc: string; icon: any; color: string }[] = [
    { id: "CORRECTO", label: "Análisis Correcto", desc: "La IA evaluó con precisión la situación clínica.", icon: CheckCircle2, color: "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300" },
    { id: "INCORRECTO", label: "Análisis Incorrecto", desc: "El análisis no refleja el cuadro real del consultante.", icon: XCircle, color: "border-red-400 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300" },
    { id: "SOBREESTIMADO", label: "Riesgo Sobreestimado", desc: "La IA asignó mayor severidad de la real.", icon: TrendingDown, color: "border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300" },
    { id: "SUBESTIMADO", label: "Riesgo Subestimado", desc: "La IA no identificó factores de riesgo críticos.", icon: TrendingUp, color: "border-orange-400 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300" },
  ];

  const statusOptions: { id: AlertStatus; label: string; icon: any }[] = [
    { id: "CONFIRMADA", label: "Confirmada", icon: ShieldAlert },
    { id: "FALSA_ALARMA", label: "Falsa Alarma", icon: XCircle },
    { id: "REQUIERE_SEGUIMIENTO", label: "Requiere Seguimiento", icon: Clock },
    { id: "CASO_CERRADO", label: "Caso Cerrado", icon: CheckCircle2 },
  ];

  const decisionOptions = [
    "Cita presencial prioritaria UCC",
    "Contacto telefónico inmediato",
    "Derivación a Centro de Escucha / EPS",
    "Seguimiento y psicoeducación en chat",
    "Intervención en crisis (urgencias)",
    "Notificación a familia",
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                  <Stethoscope className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Validación Clínica IA (RLHF)</h2>
                  <p className="text-xs text-slate-500">{target.userName} · {target.sessionTitle}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* AI Risk Card */}
              <div className={cn("rounded-2xl border-2 p-4", riskBg[aiRisk])}>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Análisis de Riesgo — Gemini IA</p>
                <div className="flex items-center gap-3">
                  <Badge className={cn("border font-bold text-sm px-3 py-1", riskColor[aiRisk])}>
                    Riesgo: {aiRisk}
                  </Badge>
                  {target.aiConfidence && (
                    <span className="text-xs text-slate-500">Confianza: {target.aiConfidence}%</span>
                  )}
                </div>
                {(target.aiAnalysisText || target.riskAnalysis) && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed line-clamp-3">
                    {target.aiAnalysisText || target.riskAnalysis}
                  </p>
                )}
              </div>

              {/* Step 1: Validation Type */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">1. Tipo de Validación</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {validationOptions.map(({ id, label, desc, icon: Icon, color }) => (
                    <button
                      key={id}
                      onClick={() => setValidationType(id)}
                      className={cn(
                        "text-left p-3 rounded-2xl border-2 transition-all hover:scale-[1.02]",
                        validationType === id ? color : "border-slate-200 bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="text-xs font-bold">{label}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Psychologist Risk */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">2. Nivel de Riesgo Clínico (Tu Criterio)</p>
                <div className="flex gap-2">
                  {(["BAJO", "MEDIO", "ALTO"] as RiskLevel[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => setPsychologistRisk(level)}
                      className={cn(
                        "flex-1 py-2.5 rounded-2xl border-2 text-xs font-bold transition-all",
                        psychologistRisk === level
                          ? cn("border", riskColor[level])
                          : "border-slate-200 dark:border-slate-700 text-slate-500"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Alert Status */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">3. Estado del Caso</p>
                <div className="grid grid-cols-2 gap-2">
                  {statusOptions.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setAlertStatus(id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2.5 rounded-2xl border-2 text-xs font-semibold transition-all",
                        alertStatus === id
                          ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700"
                          : "border-slate-200 dark:border-slate-700 text-slate-500"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 4: Professional Decision */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">4. Decisión Profesional</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {decisionOptions.map((d) => (
                    <button
                      key={d}
                      onClick={() => setProfessionalDecision(d)}
                      className={cn(
                        "text-xs px-3 py-1.5 rounded-full border transition-all",
                        professionalDecision === d
                          ? "border-indigo-400 bg-indigo-50 text-indigo-700 font-semibold"
                          : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-300"
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Correction Reason (if not CORRECTO) */}
              {validationType && validationType !== "CORRECTO" && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Motivo de Corrección</p>
                  <textarea
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    placeholder="Explica por qué discrepas del análisis de la IA (criterio técnico)..."
                    rows={2}
                    className="w-full rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm resize-none focus:outline-none focus:border-indigo-400 transition-all"
                  />
                </div>
              )}

              {/* Comments */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Observaciones Clínicas</p>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Notas adicionales, contexto del estudiante, estrategias de intervención..."
                  rows={3}
                  className="w-full rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm resize-none focus:outline-none focus:border-indigo-400 transition-all"
                />
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={!validationType || !psychologistRisk || !alertStatus || saving || saved}
                className={cn(
                  "w-full h-12 rounded-2xl font-bold text-sm transition-all",
                  saved
                    ? "bg-emerald-500 hover:bg-emerald-500"
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
                )}
              >
                {saving ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando...</>
                ) : saved ? (
                  <><Check className="h-4 w-4 mr-2" /> ¡Validación Guardada!</>
                ) : (
                  <><ClipboardList className="h-4 w-4 mr-2" /> Guardar Validación Clínica (RLHF)</>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
