"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  ExternalLink,
  ShieldAlert,
  Search,
  X,
  MessageSquare
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Alert {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  message: string;
  riskAnalysis: string;
  timestamp: any;
  status: "PENDIENTE" | "ATENDIDA";
}

interface Message {
  role: string;
  content: string;
  timestamp: any;
}

export default function AlertsDashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedUserHistory, setSelectedUserHistory] = useState<Message[] | null>(null);
  const [selectedUserName, setSelectedUserName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  // Protección de ruta (Solo para psicólogos - Por ahora solo verificamos auth)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Cargar alertas en tiempo real
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "emergency_alerts"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedAlerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Alert[];
      setAlerts(loadedAlerts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const viewHistory = (userId: string, userName: string) => {
    setSelectedUserName(userName);
    setIsModalOpen(true);
    
    const q = query(
      collection(db, "users", userId, "chat_history"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const history = snapshot.docs.map(doc => doc.data()) as Message[];
      setSelectedUserHistory(history);
    });

    return unsubscribe;
  };

  const saveNote = async (alertId: string, note: string) => {
    try {
      const alertRef = doc(db, "emergency_alerts", alertId);
      await updateDoc(alertRef, { professionalNotes: note });
    } catch (error) {
      console.error("Error al guardar nota:", error);
    }
  };

  const markAsResolved = async (alertId: string) => {
    try {
      const alertRef = doc(db, "emergency_alerts", alertId);
      await updateDoc(alertRef, { status: "ATENDIDA" });
    } catch (error) {
      console.error("Error al actualizar alerta:", error);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-destructive border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Cargando centro de emergencias...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 relative">
      {/* ... (Header) */}
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 text-destructive mb-2 font-bold tracking-wider text-sm uppercase">
              <ShieldAlert className="h-4 w-4" />
              Centro de Monitoreo Crítico
            </div>
            <h1 className="text-4xl font-serif font-bold text-slate-900">Alertas de Riesgo</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-slate-500">Alertas Pendientes</p>
                <p className="text-xl font-bold text-destructive">
                  {alerts.filter(a => a.status === "PENDIENTE").length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <AnimatePresence>
            {alerts.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200"
              >
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-slate-900">Todo está bajo control</h2>
                <p className="text-slate-500 mt-2">No se han detectado alertas de riesgo en este momento.</p>
              </motion.div>
            ) : (
              alerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`bg-white rounded-3xl border-2 shadow-sm transition-all overflow-hidden ${
                    alert.status === "PENDIENTE" ? "border-destructive/20 ring-1 ring-destructive/5" : "border-slate-100 opacity-75"
                  }`}
                >
                  <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      {/* Información del Usuario */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                            alert.status === "PENDIENTE" ? "bg-destructive" : "bg-slate-400"
                          }`}>
                            <User className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-slate-900">{alert.userName}</h3>
                            <p className="text-sm text-slate-500">{alert.userEmail}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={alert.status === "PENDIENTE" ? "destructive" : "secondary"} className="rounded-full px-4 py-1">
                            {alert.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Mensaje de Riesgo */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Mensaje del Usuario</p>
                        <p className="text-slate-700 italic font-medium">"{alert.message}"</p>
                        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-2 text-xs text-destructive font-bold">
                          <AlertTriangle className="h-3 w-3" />
                          IA ANALISIS: {alert.riskAnalysis}
                        </div>
                      </div>

                      {/* Notas Profesionales (NUEVO) */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Notas del Psicólogo</label>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                            <Clock className="h-3 w-3" />
                            {alert.timestamp?.toDate ? format(alert.timestamp.toDate(), "d MMM, HH:mm", { locale: es }) : "Reciente"}
                          </div>
                        </div>
                        <textarea 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all min-h-[80px]"
                          placeholder="Escribe aquí las observaciones del caso..."
                          defaultValue={(alert as any).professionalNotes || ""}
                          onBlur={(e) => saveNote(alert.id, e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col gap-3 justify-start min-w-[200px]">
                      {alert.status === "PENDIENTE" ? (
                        <Button 
                          onClick={() => markAsResolved(alert.id)}
                          className="bg-destructive hover:bg-destructive/90 text-white rounded-xl h-11"
                        >
                          Marcar como Atendida
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 p-3 rounded-xl justify-center">
                          <CheckCircle className="h-4 w-4" />
                          Caso Cerrado
                        </div>
                      )}
                      
                      <Button 
                        variant="outline" 
                        className="rounded-xl h-11 border-slate-200"
                        onClick={() => viewHistory(alert.userId, alert.userName)}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Ver Historial
                      </Button>

                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <a href={`mailto:${alert.userEmail}`} className="contents">
                          <Button variant="secondary" className="rounded-xl text-xs h-10">
                            Email
                          </Button>
                        </a>
                        <Button variant="secondary" className="rounded-xl text-xs h-10" onClick={() => window.open(`https://wa.me/?text=Hola ${alert.userName}, soy tu psicólogo de LUMEN...`, '_blank')}>
                          WhatsApp
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* MODAL DE HISTORIAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-2xl max-h-[80vh] rounded-3xl shadow-2xl z-10 overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <h2 className="font-bold text-xl">Conversación de {selectedUserName}</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-full">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                {!selectedUserHistory ? (
                  <div className="flex flex-col items-center justify-center h-40">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-sm text-slate-500">Recuperando mensajes...</p>
                  </div>
                ) : (
                  selectedUserHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground rounded-tr-none' 
                          : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                      }`}>
                        <p>{msg.content}</p>
                        <p className={`text-[10px] mt-1 opacity-60 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                          {msg.timestamp?.toDate ? format(msg.timestamp.toDate(), "HH:mm", { locale: es }) : "Reciente"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 bg-white border-t border-slate-100 text-center">
                <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Fin del historial actual</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
