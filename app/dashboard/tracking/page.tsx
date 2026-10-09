"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  orderBy,
  where,
  Timestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  User,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Brain,
  Calendar,
  ChevronRight,
  Activity,
  Heart,
  Search,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PsychologistFeedbackModal, FeedbackTarget } from "@/components/psychologist-feedback-modal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PatientSummary {
  uid: string;
  displayName: string;
  email: string;
  isAnonymous?: boolean;
  alias?: string;
  sessionsCount: number;
  lastRisk: string;
  lastSeen: string;
}

interface SessionData {
  id: string;
  title: string;
  createdAt: any;
  dominantRisk: string;
  riskScore: number;
  emotions: { ansiedad: number; tristeza: number; estres: number; esperanza: number; calma: number };
  themes: string[];
  messagesCount: number;
  riskAnalysis: string;
}

interface TrendAnalysis {
  riskTrajectory: "ALCISTA" | "BAJISTA" | "ESTABLE";
  riskDelta: number;
  wellnessScore: number;
  wellnessDelta: number;
  anxietyTrend: string;
  hopeTrend: string;
  sustainedThemes: { theme: string; count: number; percentage: number; status: string }[];
  clinicalTakeaway: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const riskToScore = (r: string) => r === "ALTO" ? 80 : r === "MEDIO" ? 50 : 20;

function calcWellness(riskScore: number, emotions: SessionData["emotions"]) {
  return Math.max(0, Math.min(100,
    100 - riskScore * 0.6 + (emotions?.esperanza || 0) * 0.3 - (emotions?.ansiedad || 0) * 0.2
  ));
}

function computeTrend(sessions: SessionData[]): TrendAnalysis {
  if (sessions.length < 2) {
    const s = sessions[0];
    return {
      riskTrajectory: "ESTABLE",
      riskDelta: 0,
      wellnessScore: s ? calcWellness(s.riskScore, s.emotions) : 50,
      wellnessDelta: 0,
      anxietyTrend: "ESTABLE",
      hopeTrend: "ESTABLE",
      sustainedThemes: [],
      clinicalTakeaway: "Se requieren al menos 2 sesiones para calcular tendencias clínicas.",
    };
  }

  const first = sessions[0];
  const last = sessions[sessions.length - 1];
  const riskDelta = last.riskScore - first.riskScore;
  const wellFirst = calcWellness(first.riskScore, first.emotions);
  const wellLast = calcWellness(last.riskScore, last.emotions);
  const wellnessDelta = Math.round(wellLast - wellFirst);

  const trajectory: TrendAnalysis["riskTrajectory"] =
    riskDelta > 15 ? "ALCISTA" : riskDelta < -15 ? "BAJISTA" : "ESTABLE";

  // Theme frequency
  const themeCount: Record<string, number> = {};
  sessions.forEach(s => s.themes?.forEach(t => { themeCount[t] = (themeCount[t] || 0) + 1; }));
  const total = sessions.length;
  const sustainedThemes = Object.entries(themeCount)
    .map(([theme, count]) => ({
      theme,
      count,
      percentage: Math.round((count / total) * 100),
      status: count / total >= 0.7 ? "CRÓNICO" : count / total >= 0.4 ? "RECURRENTE" : "PUNTUAL",
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const avgAnxFirst = (first.emotions?.ansiedad || 0) + (first.emotions?.estres || 0);
  const avgAnxLast = (last.emotions?.ansiedad || 0) + (last.emotions?.estres || 0);
  const anxietyTrend = avgAnxLast > avgAnxFirst + 10 ? "CRECIENTE ↗" : avgAnxLast < avgAnxFirst - 10 ? "DECRECIENTE ↘" : "ESTABLE →";
  const hopeTrend = (last.emotions?.esperanza || 0) > (first.emotions?.esperanza || 0) + 10
    ? "CRECIENTE ↗" : (last.emotions?.esperanza || 0) < (first.emotions?.esperanza || 0) - 10
    ? "DECRECIENTE ↘" : "ESTABLE →";

  const clinicalTakeaway = trajectory === "ALCISTA"
    ? `El consultante evidencia una curva de escalada de riesgo (+${riskDelta} pts). Se recomienda intervención prioritaria.`
    : trajectory === "BAJISTA"
    ? `El consultante muestra evolución favorable (${riskDelta} pts). Continuar acompañamiento de mantenimiento.`
    : `El patrón de riesgo se mantiene estable. Continuar monitoreo regular.`;

  return { riskTrajectory: trajectory, riskDelta, wellnessScore: Math.round(wellLast), wellnessDelta, anxietyTrend, hopeTrend, sustainedThemes, clinicalTakeaway };
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function TrackingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedUserId = searchParams.get("userId");

  const [authUser, setAuthUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientSummary | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [trend, setTrend] = useState<TrendAnalysis | null>(null);
  const [chartTab, setChartTab] = useState<"riesgo" | "emociones">("riesgo");

  // Feedback modal
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackTarget, setFeedbackTarget] = useState<FeedbackTarget | null>(null);

  // Auth guard
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists() && snap.data().role === "psicologo") {
          setAuthUser(u);
          await loadPatients();
        } else {
          router.push("/chat");
        }
      } else {
        router.push("/login");
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  // Preselect patient from URL
  useEffect(() => {
    if (preselectedUserId && patients.length > 0) {
      const p = patients.find(p => p.uid === preselectedUserId);
      if (p) selectPatient(p);
    }
  }, [preselectedUserId, patients]);

  async function loadPatients() {
    try {
      // Load from emergency_alerts to get unique users
      const alertsSnap = await getDocs(query(collection(db, "emergency_alerts"), orderBy("timestamp", "desc")));
      const seen = new Set<string>();
      const list: PatientSummary[] = [];

      for (const alertDoc of alertsSnap.docs) {
        const data = alertDoc.data();
        if (seen.has(data.userId)) continue;
        seen.add(data.userId);

        // Count sessions
        let sessionsCount = 0;
        try {
          const sessSnap = await getDocs(collection(db, "users", data.userId, "sessions"));
          sessionsCount = sessSnap.size;
        } catch (_) {}

        list.push({
          uid: data.userId,
          displayName: data.userName || "Estudiante",
          email: data.userEmail || "",
          isAnonymous: data.isAnonymous,
          sessionsCount,
          lastRisk: data.risk_level || "ALTO",
          lastSeen: data.timestamp?.toDate ? format(data.timestamp.toDate(), "d MMM", { locale: es }) : "Reciente",
        });
      }

      setPatients(list);
    } catch (err) {
      console.warn("Error loading patients:", err);
    }
  }

  async function selectPatient(patient: PatientSummary) {
    setSelectedPatient(patient);
    setLoadingSessions(true);
    setSessions([]);
    setTrend(null);
    try {
      const sessSnap = await getDocs(
        query(collection(db, "users", patient.uid, "sessions"), orderBy("createdAt", "asc"))
      );

      const sessionList: SessionData[] = [];
      for (const sessDoc of sessSnap.docs) {
        const sessData = sessDoc.data();
        // Get messages
        const msgSnap = await getDocs(
          query(collection(db, "users", patient.uid, "sessions", sessDoc.id, "messages"), orderBy("timestamp", "asc"))
        );

        // Aggregate emotion and risk data from messages
        let dominantRisk = "BAJO";
        let riskScore = 20;
        let themes: string[] = [];
        let riskAnalysis = "";
        const emoAgg = { ansiedad: 0, tristeza: 0, estres: 0, esperanza: 0, calma: 0 };
        let emoCount = 0;

        msgSnap.docs.forEach(m => {
          const d = m.data();
          if (d.role === "assistant") {
            if (d.risk_level) {
              dominantRisk = d.risk_level;
              riskScore = riskToScore(d.risk_level);
            }
            if (d.risk_confidence) riskScore = d.risk_confidence;
            if (d.themes) themes = [...new Set([...themes, ...d.themes])];
            if (d.risk_analysis) riskAnalysis = d.risk_analysis;
            if (d.emotions) {
              Object.keys(emoAgg).forEach(k => {
                emoAgg[k as keyof typeof emoAgg] += (d.emotions?.[k] || 0);
              });
              emoCount++;
            }
          }
        });

        if (emoCount > 0) {
          Object.keys(emoAgg).forEach(k => {
            emoAgg[k as keyof typeof emoAgg] = Math.round(emoAgg[k as keyof typeof emoAgg] / emoCount);
          });
        }

        sessionList.push({
          id: sessDoc.id,
          title: sessData.title || "Sesión sin título",
          createdAt: sessData.createdAt,
          dominantRisk,
          riskScore,
          emotions: emoAgg,
          themes,
          messagesCount: msgSnap.size,
          riskAnalysis,
        });
      }

      setSessions(sessionList);
      if (sessionList.length > 0) setTrend(computeTrend(sessionList));
    } catch (err) {
      console.warn("Error loading sessions:", err);
    } finally {
      setLoadingSessions(false);
    }
  }

  const filteredPatients = patients.filter(p =>
    p.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const chartData = sessions.map((s, i) => ({
    name: `S${i + 1}`,
    riesgo: s.riskScore,
    bienestar: Math.round(calcWellness(s.riskScore, s.emotions)),
    ansiedad: s.emotions.ansiedad,
    tristeza: s.emotions.tristeza,
    estres: s.emotions.estres,
    esperanza: s.emotions.esperanza,
    calma: s.emotions.calma,
  }));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard/alerts">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-bold text-lg">Seguimiento Clínico</h1>
            <p className="text-xs text-muted-foreground">Evolución longitudinal de estudiantes · LUMEN UCC</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Patient List */}
        <div className="md:col-span-1">
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-sm mb-3">Estudiantes</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar estudiante..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto divide-y divide-border">
              {filteredPatients.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No hay estudiantes con alertas registradas.
                </div>
              ) : filteredPatients.map(p => (
                <button
                  key={p.uid}
                  onClick={() => selectPatient(p)}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-accent transition-all flex items-center gap-3",
                    selectedPatient?.uid === p.uid && "bg-primary/5 border-l-4 border-primary"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0",
                    p.isAnonymous ? "bg-purple-500" : "bg-primary"
                  )}>
                    {p.isAnonymous ? <Shield className="h-4 w-4" /> : p.displayName[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{p.displayName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{p.isAnonymous ? "Modo Anónimo" : p.email}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge className={cn(
                      "text-[10px] border font-bold",
                      p.lastRisk === "ALTO" ? "bg-red-100 text-red-800 border-red-200" :
                      p.lastRisk === "MEDIO" ? "bg-amber-100 text-amber-800 border-amber-200" :
                      "bg-emerald-100 text-emerald-800 border-emerald-200"
                    )}>
                      {p.lastRisk}
                    </Badge>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{p.lastSeen}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tracking Panel */}
        <div className="md:col-span-2 space-y-5">
          {!selectedPatient ? (
            <div className="bg-card rounded-2xl border border-border p-12 flex flex-col items-center text-center">
              <Activity className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="font-semibold text-slate-600 mb-1">Selecciona un Estudiante</h3>
              <p className="text-xs text-muted-foreground max-w-xs">Elige un estudiante del panel izquierdo para ver su evolución clínica longitudinal.</p>
            </div>
          ) : loadingSessions ? (
            <div className="bg-card rounded-2xl border border-border p-12 flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Cargando historial clínico...</p>
            </div>
          ) : (
            <>
              {/* Patient Header */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-lg",
                    selectedPatient.isAnonymous ? "bg-purple-500" : "bg-primary"
                  )}>
                    {selectedPatient.isAnonymous ? <Shield className="h-6 w-6" /> : selectedPatient.displayName[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-bold text-lg">{selectedPatient.displayName}</h2>
                      {selectedPatient.isAnonymous && (
                        <Badge className="bg-purple-100 text-purple-800 border border-purple-200 text-[10px]">🛡️ Anónimo</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{selectedPatient.isAnonymous ? "Privacidad activa" : selectedPatient.email}</p>
                    <p className="text-xs text-muted-foreground">{sessions.length} sesiones registradas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">Índice Bienestar</p>
                    <p className={cn(
                      "text-2xl font-bold",
                      (trend?.wellnessScore || 0) >= 60 ? "text-emerald-600" :
                      (trend?.wellnessScore || 0) >= 40 ? "text-amber-600" : "text-red-600"
                    )}>
                      {trend?.wellnessScore ?? "—"}%
                    </p>
                    {trend && trend.wellnessDelta !== 0 && (
                      <p className={cn("text-[10px] font-semibold", trend.wellnessDelta > 0 ? "text-emerald-600" : "text-red-600")}>
                        {trend.wellnessDelta > 0 ? "+" : ""}{trend.wellnessDelta}% vs. inicio
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Trend Summary */}
              {trend && (
                <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    Análisis de Tendencias Clínicas
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-muted-foreground mb-1">Trayectoria</p>
                      <div className="flex justify-center mb-1">
                        {trend.riskTrajectory === "ALCISTA" ? <TrendingUp className="h-5 w-5 text-red-500" /> :
                         trend.riskTrajectory === "BAJISTA" ? <TrendingDown className="h-5 w-5 text-emerald-500" /> :
                         <Minus className="h-5 w-5 text-amber-500" />}
                      </div>
                      <p className="text-xs font-bold">{trend.riskTrajectory}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-muted-foreground mb-1">Ansiedad/Estrés</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{trend.anxietyTrend}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-muted-foreground mb-1">Esperanza</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{trend.hopeTrend}</p>
                    </div>
                  </div>
                  <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{trend.clinicalTakeaway}</p>
                  </div>
                  {trend.sustainedThemes.length > 0 && (
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-2 font-semibold uppercase tracking-widest">Focos Temáticos</p>
                      <div className="flex flex-wrap gap-1.5">
                        {trend.sustainedThemes.map(t => (
                          <Badge key={t.theme} className={cn(
                            "text-[10px] border",
                            t.status === "CRÓNICO" ? "bg-red-100 text-red-800 border-red-200" :
                            t.status === "RECURRENTE" ? "bg-amber-100 text-amber-800 border-amber-200" :
                            "bg-slate-100 text-slate-700 border-slate-200"
                          )}>
                            {t.theme} ({t.percentage}%) · {t.status}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Charts */}
              {chartData.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm">Evolución Longitudinal</h3>
                    <div className="flex gap-1">
                      {(["riesgo", "emociones"] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setChartTab(tab)}
                          className={cn(
                            "px-3 py-1 rounded-lg text-xs font-semibold transition-all",
                            chartTab === tab ? "bg-primary text-primary-foreground" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                          )}
                        >
                          {tab === "riesgo" ? "Riesgo & Bienestar" : "Emociones (5)"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartTab === "riesgo" ? (
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="wellGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                          <Tooltip contentStyle={{ borderRadius: "12px", fontSize: "12px" }} />
                          <Area type="monotone" dataKey="riesgo" stroke="#f43f5e" fill="url(#riskGrad)" name="Riesgo" />
                          <Area type="monotone" dataKey="bienestar" stroke="#6366f1" fill="url(#wellGrad)" name="Bienestar" />
                        </AreaChart>
                      ) : (
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                          <Tooltip contentStyle={{ borderRadius: "12px", fontSize: "12px" }} />
                          <Line type="monotone" dataKey="ansiedad" stroke="#f43f5e" dot={false} name="Ansiedad" />
                          <Line type="monotone" dataKey="estres" stroke="#f59e0b" dot={false} name="Estrés" />
                          <Line type="monotone" dataKey="tristeza" stroke="#6366f1" dot={false} name="Tristeza" />
                          <Line type="monotone" dataKey="esperanza" stroke="#10b981" dot={false} name="Esperanza" />
                          <Line type="monotone" dataKey="calma" stroke="#06b6d4" dot={false} name="Calma" />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Session List */}
              {sessions.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border p-8 text-center text-xs text-muted-foreground">
                  Este estudiante no tiene sesiones de chat registradas.
                </div>
              ) : (
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <h3 className="font-semibold text-sm">Línea de Tiempo de Sesiones</h3>
                  </div>
                  <div className="divide-y divide-border max-h-80 overflow-y-auto">
                    {sessions.map((s, idx) => (
                      <div key={s.id} className="p-4 flex items-start gap-4 hover:bg-accent/50 transition-all">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-sm font-semibold truncate">{s.title}</p>
                            <Badge className={cn(
                              "text-[10px] border font-bold",
                              s.dominantRisk === "ALTO" ? "bg-red-100 text-red-800 border-red-200" :
                              s.dominantRisk === "MEDIO" ? "bg-amber-100 text-amber-800 border-amber-200" :
                              "bg-emerald-100 text-emerald-800 border-emerald-200"
                            )}>
                              {s.dominantRisk}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground">{s.messagesCount} mensajes · Confianza IA: {s.riskScore}%</p>
                          {s.themes.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {s.themes.slice(0, 3).map(t => (
                                <span key={t} className="text-[9px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0 rounded-xl text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                          onClick={() => {
                            setFeedbackTarget({
                              alertId: s.id,
                              sessionId: s.id,
                              sessionTitle: s.title,
                              userId: selectedPatient.uid,
                              userName: selectedPatient.displayName,
                              userEmail: selectedPatient.email,
                              aiRisk: s.dominantRisk,
                              aiConfidence: s.riskScore,
                              riskAnalysis: s.riskAnalysis,
                            });
                            setIsFeedbackOpen(true);
                          }}
                        >
                          Validar IA
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      <PsychologistFeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        target={feedbackTarget}
      />
    </div>
  );
}
