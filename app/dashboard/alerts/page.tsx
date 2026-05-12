"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, updateDoc, doc, getDoc, addDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  ExternalLink,
  ShieldAlert,
  Search,
  X,
  MessageSquare,
  Plus,
  ArrowRight,
  Sparkles,
  History as HistoryIcon,
  ChevronLeft,
  LogOut
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  userId: string;
  sessionId: string;
  sessionTitle: string;
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
  const [lastAlertId, setLastAlertId] = useState<string | null>(null);
  const [profMessage, setProfMessage] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isIntervening, setIsIntervening] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const router = useRouter();

  // Lógica de Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAlerts = alerts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(alerts.length / itemsPerPage);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const markAsResolved = async (alertId: string, userId: string) => {
    try {
      // 1. Marcar la alerta como atendida
      const alertRef = doc(db, "emergency_alerts", alertId);
      await updateDoc(alertRef, { status: "ATENDIDA" });

      // 2. Desactivar intervención humana para que la IA vuelva a responder
      const userRef = doc(db, "users", userId);
      await setDoc(userRef, { isUnderCare: false }, { merge: true });
      
      // Si el modal está abierto para este usuario, actualizar estado local
      if (selectedUserId === userId) {
        setIsIntervening(false);
      }
    } catch (error) {
      console.error("Error al cerrar caso:", error);
    }
  };

  // Función para reproducir sonido de alerta
  const playAlertSound = () => {
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    audio.volume = 0.5;
    audio.play().catch(e => console.log("Audio play blocked by browser"));
  };

  // Protección de ruta (Solo para psicólogos)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Verificar Rol en Firestore
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists() && userDoc.data().role === "psicologo") {
          setUser(currentUser);
        } else {
          // Si no es psicólogo, redirigir al chat
          router.push("/chat");
        }
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Cargar alertas en tiempo real con sonido
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

      // Si hay una alerta nueva PENDIENTE, sonar alarma
      if (loadedAlerts.length > 0) {
        const newestAlert = loadedAlerts[0];
        if (newestAlert.status === "PENDIENTE" && lastAlertId && newestAlert.id !== lastAlertId) {
          playAlertSound();
        }
        setLastAlertId(newestAlert.id);
      }

      setAlerts(loadedAlerts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, lastAlertId]);

  const [historyUnsubscribe, setHistoryUnsubscribe] = useState<(() => void) | null>(null);

  const viewHistory = async (userId: string, userName: string, sessionId?: string) => {
    // Limpiar suscripción anterior si existe
    if (historyUnsubscribe) {
      historyUnsubscribe();
    }

    setSelectedUserName(userName);
    setSelectedUserId(userId);
    setIsModalOpen(true);
    setSelectedUserHistory(null);
    
    const userSnap = await getDoc(doc(db, "users", userId));
    setIsIntervening(userSnap.data()?.isUnderCare || false);
    
    try {
      const historyPath = sessionId 
        ? collection(db, "users", userId, "sessions", sessionId, "messages")
        : collection(db, "users", userId, "chat_history");

      const q = query(historyPath, orderBy("timestamp", "asc"));

      const unsub = onSnapshot(q, (snapshot) => {
        const history = snapshot.docs.map(doc => doc.data()) as Message[];
        setSelectedUserHistory(history);
      });

      setHistoryUnsubscribe(() => unsub);
    } catch (error) {
      console.error("Error al cargar historial:", error);
      setSelectedUserHistory([]);
    }
  };

  const closeModal = () => {
    if (historyUnsubscribe) {
      historyUnsubscribe();
      setHistoryUnsubscribe(null);
    }
    setIsModalOpen(false);
  };

  const saveNote = async (alertId: string, note: string) => {
    try {
      const alertRef = doc(db, "emergency_alerts", alertId);
      await updateDoc(alertRef, { professionalNotes: note });
    } catch (error) {
      console.error("Error al guardar nota:", error);
    }
  };

  const toggleIntervention = async (userId: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, "users", userId);
      // Usamos setDoc con merge:true para que cree el documento si no existe
      await setDoc(userRef, { isUnderCare: !currentStatus }, { merge: true });
      setIsIntervening(!currentStatus);
    } catch (error) {
      console.error("Error al cambiar modo de intervención:", error);
    }
  };

  const sendMessageAsProfessional = async (userId: string, text: string) => {
    if (!text.trim() || !selectedUserId) return;
    try {
      // Necesitamos saber en qué sesión estamos interviniendo
      // Buscamos la alerta correspondiente para obtener el sessionId
      const alert = alerts.find(a => a.userId === userId);
      if (!alert) return;

      await addDoc(collection(db, "users", userId, "sessions", alert.sessionId, "messages"), {
        role: "assistant",
        content: `[PROFESIONAL] ${text}`,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error al enviar mensaje profesional:", error);
    }
  };

  const [searchQuery, setSearchQuery] = useState("");

  const filteredAlerts = alerts.filter(alert => 
    alert.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    alert.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    alert.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div className="max-w-6xl mx-auto">
        {/* HEADER MEJORADO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-primary mb-2 font-bold tracking-wider text-sm uppercase">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Centro de Monitoreo Crítico
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 tracking-tight">
              Alertas de Riesgo
            </h1>
          </div>
          <div className="flex flex-wrap gap-4 justify-end">
            <Link href="/dashboard/alerts/new-resource">
              <Button className="h-14 md:h-16 px-6 md:px-8 rounded-2xl bg-primary shadow-xl shadow-primary/30 flex items-center gap-3 transition-all hover:scale-105 active:scale-95 md:text-lg">
                <Plus className="h-5 w-5 md:h-6 md:w-6" />
                <span className="hidden md:inline">Publicar Artículo</span>
                <span className="md:hidden">Publicar</span>
              </Button>
            </Link>
            <Button 
              onClick={handleSignOut}
              variant="outline"
              className="h-14 md:h-16 px-4 md:px-6 rounded-2xl border-slate-200 text-slate-600 flex items-center gap-3 transition-all hover:bg-slate-100 hover:text-slate-900 md:text-lg"
            >
              <LogOut className="h-5 w-5 md:h-6 md:w-6" />
              <span className="hidden md:inline">Cerrar Sesión</span>
            </Button>
          </div>
        </div>

        {/* MÉTRICAS PRO (KPIs) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: "Alertas Pendientes", value: alerts.filter(a => a.status === "PENDIENTE").length, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/5" },
            { label: "Casos Atendidos", value: alerts.filter(a => a.status === "ATENDIDA").length, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Usuarios en Riesgo", value: new Set(alerts.map(a => a.userId)).size, icon: User, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Tiempo de Respuesta", value: "4.2 min", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all"
            >
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
                <p className={cn("text-3xl font-bold font-serif", stat.color)}>{stat.value}</p>
              </div>
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", stat.bg)}>
                <stat.icon className={cn("h-7 w-7", stat.color)} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* BUSCADOR Y FILTROS */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm mb-10 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por paciente o correo..." 
              value={searchQuery || ""}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-primary/20 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" className="flex-1 md:flex-none h-12 rounded-2xl border-slate-200">Hoy</Button>
            <Button variant="outline" className="flex-1 md:flex-none h-12 rounded-2xl border-slate-200">Críticos</Button>
          </div>
        </div>

        <div className="grid gap-6 pb-20">
          <AnimatePresence mode="wait">
            {currentAlerts.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200"
              >
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-slate-900">
                  {searchQuery ? "No hay resultados para tu búsqueda" : "Todo está bajo control"}
                </h2>
                <p className="text-slate-500 mt-2">
                  {searchQuery ? "Intenta con otro nombre o correo." : "No se han detectado alertas de riesgo en este momento."}
                </p>
              </motion.div>
            ) : (
              <div className="grid gap-6">
                {currentAlerts.map((alert) => (
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
                        {/* Info del Usuario Restaurada */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                              alert.status === "PENDIENTE" ? "bg-destructive" : "bg-slate-400"
                            }`}>
                              <User className="h-6 w-6" />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-800 leading-none mb-1">{alert.userName}</h3>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <span className="flex items-center gap-1">
                                  <HistoryIcon className="h-2.5 w-2.5" />
                                  {alert.timestamp?.toDate ? format(alert.timestamp.toDate(), "d MMM, HH:mm", { locale: es }) : "Reciente"}
                                </span>
                                <span className="text-slate-200">•</span>
                                <span className="font-medium text-primary uppercase tracking-tighter truncate max-w-[120px]">
                                  {alert.sessionTitle || "General"}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1">{alert.userEmail}</p>
                            </div>
                          </div>
                          <Badge variant={alert.status === "PENDIENTE" ? "destructive" : "secondary"} className="rounded-full px-4 py-1">
                            {alert.status}
                          </Badge>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Mensaje del Usuario</p>
                          <p className="text-slate-700 italic font-medium">"{alert.message}"</p>
                          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-2 text-xs text-destructive font-bold">
                            <AlertTriangle className="h-3 w-3" />
                            IA ANALISIS: {alert.riskAnalysis}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Notas del Psicólogo</label>
                          <textarea 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all min-h-[60px]"
                            placeholder="Anotaciones del caso..."
                            defaultValue={(alert as any).professionalNotes || ""}
                            onBlur={(e) => saveNote(alert.id, e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 justify-start min-w-[200px]">
                        {alert.status === "PENDIENTE" ? (
                          <Button 
                            onClick={() => markAsResolved(alert.id, alert.userId)}
                            className="bg-destructive hover:bg-destructive/90 text-white rounded-xl h-11 shadow-lg shadow-destructive/20"
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
                          onClick={() => viewHistory(alert.userId, alert.userName, alert.sessionId)}
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Ver Historial
                        </Button>

                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="secondary" className="rounded-xl text-[10px] h-9" onClick={() => window.open(`mailto:${alert.userEmail}`)}>Email</Button>
                          <Button variant="secondary" className="rounded-xl text-[10px] h-9" onClick={() => window.open(`https://wa.me/?text=Hola ${alert.userName}...`, '_blank')}>WhatsApp</Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* Controles de Paginación UI */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8 pb-10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-xl border-slate-200 h-10 w-10 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                <Button
                  key={number}
                  onClick={() => paginate(number)}
                  variant={currentPage === number ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "rounded-xl h-10 w-10 font-bold",
                    currentPage === number ? "shadow-lg shadow-primary/20" : "border-slate-200 text-slate-500"
                  )}
                >
                  {number}
                </Button>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="rounded-xl border-slate-200 h-10 w-10 p-0"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
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
                  <div className="flex flex-col">
                    <h2 className="font-bold text-xl leading-tight">Conversación de {selectedUserName}</h2>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${isIntervening ? 'bg-primary animate-pulse' : 'bg-slate-300'}`} />
                      {isIntervening ? 'Intervención Activa' : 'Modo IA'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant={isIntervening ? "destructive" : "outline"}
                    size="sm"
                    className="rounded-xl h-10 px-4"
                    onClick={() => selectedUserId && toggleIntervention(selectedUserId, isIntervening)}
                  >
                    {isIntervening ? "Cerrar Intervención" : "Intervenir Chat"}
                  </Button>
                  {isIntervening && (
                    <Button 
                      variant="outline"
                      size="sm"
                      className="rounded-xl h-10 px-2 text-slate-400 hover:text-primary"
                      title="Forzar reactivación de IA"
                      onClick={() => selectedUserId && toggleIntervention(selectedUserId, true)}
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={closeModal} className="rounded-full h-10 w-10">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
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
                          : msg.content.includes('[PROFESIONAL]')
                            ? 'bg-primary/10 border-2 border-primary/20 text-primary font-medium rounded-tl-none'
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

              {isIntervening && (
                <div className="p-4 bg-white border-t border-slate-100 flex gap-2 animate-in slide-in-from-bottom-2 duration-300">
                  <input 
                    type="text"
                    value={profMessage}
                    onChange={(e) => setProfMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && selectedUserId && (sendMessageAsProfessional(selectedUserId, profMessage), setProfMessage(""))}
                    placeholder="Escribe tu respuesta profesional..."
                    className="flex-1 h-12 bg-slate-50 border-transparent rounded-xl px-4 text-sm focus:bg-white focus:border-primary/20 outline-none transition-all"
                  />
                  <Button 
                    onClick={() => selectedUserId && (sendMessageAsProfessional(selectedUserId, profMessage), setProfMessage(""))}
                    className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center p-0"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>
              )}

              {!isIntervening && (
                <div className="p-4 bg-white border-t border-slate-100 text-center">
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Fin del historial actual</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
