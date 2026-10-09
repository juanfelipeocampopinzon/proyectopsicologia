"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  Send, 
  Sparkles, 
  Phone, 
  Smile, 
  ShieldAlert, 
  UserCircle, 
  MessageSquare, 
  Plus, 
  Menu, 
  Trash2, 
  Shield, 
  ShieldCheck, 
  UserCheck, 
  Ghost,
  Lock, 
  Settings, 
  Check, 
  X, 
  Info,
  AlertTriangle,
  RefreshCw,
  FileText
} from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { db, auth } from "@/lib/firebase"
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  Timestamp, 
  doc, 
  updateDoc, 
  getDoc,
  getDocs,
  writeBatch
} from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { chatWithGemini, logToBigQuery } from "./actions"

export type PrivacyTier = "IDENTIFICADO" | "ANONIMO" | "INCOGNITO"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface Session {
  id: string
  title: string
  createdAt: any
  isAnonymous?: boolean
  alias?: string
  privacyTier?: PrivacyTier
}

const quickReplies = [
  "Me siento ansioso",
  "Necesito hablar",
  "Tengo estrés por exámenes",
  "No puedo dormir bien",
]

export default function ChatPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isUnderCare, setIsUnderCare] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Niveles de Privacidad y Habeas Data (Ley 1581 de 2012)
  const [privacyTier, setPrivacyTier] = useState<PrivacyTier>("IDENTIFICADO")
  const [anonymousAlias, setAnonymousAlias] = useState<string>("")
  const [aliasInput, setAliasInput] = useState<string>("")
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false)
  const [activePrivacyTab, setActivePrivacyTab] = useState<"modos" | "habeas_data">("modos")
  
  // Estado para borrado de sesiones (Derecho de Supresión)
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null)
  const [isPurgingAll, setIsPurgingAll] = useState(false)
  const [purgeSuccess, setPurgeSuccess] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // 1. Inicializar preferencias de privacidad desde LocalStorage
  useEffect(() => {
    const savedTier = localStorage.getItem("lumen_privacy_tier") as PrivacyTier | null
    const savedAlias = localStorage.getItem("lumen_anonymous_alias")

    if (savedTier && ["IDENTIFICADO", "ANONIMO", "INCOGNITO"].includes(savedTier)) {
      setPrivacyTier(savedTier)
    } else {
      // Compatibilidad con versión anterior
      const oldAnon = localStorage.getItem("lumen_is_anonymous")
      if (oldAnon === "true") {
        setPrivacyTier("ANONIMO")
      } else {
        setPrivacyTier("IDENTIFICADO")
      }
    }

    if (savedAlias) {
      setAnonymousAlias(savedAlias)
      setAliasInput(savedAlias)
    } else {
      const randomCode = Math.floor(1000 + Math.random() * 9000)
      const defaultAlias = `Estudiante #${randomCode}`
      setAnonymousAlias(defaultAlias)
      setAliasInput(defaultAlias)
      localStorage.setItem("lumen_anonymous_alias", defaultAlias)
    }
  }, [])

  // Guardar configuración de privacidad
  const handleSavePrivacyMode = (newTier: PrivacyTier, newAlias?: string) => {
    setPrivacyTier(newTier)
    localStorage.setItem("lumen_privacy_tier", newTier)
    localStorage.setItem("lumen_is_anonymous", newTier === "ANONIMO" ? "true" : "false")

    const cleanAlias = (newAlias && newAlias.trim()) ? newAlias.trim() : anonymousAlias
    if (cleanAlias) {
      setAnonymousAlias(cleanAlias)
      setAliasInput(cleanAlias)
      localStorage.setItem("lumen_anonymous_alias", cleanAlias)
    }

    // Si pasa a incógnito, limpiar sesión actual para iniciar una efímera en memoria
    if (newTier === "INCOGNITO") {
      setCurrentSessionId(null)
      setMessages([{
        id: "incognito-welcome",
        role: "assistant",
        content: "👻 **Modo Incógnito Activado (Sesión Efímera)**\n\nEsta conversación existe **únicamente en la memoria de tu navegador**. Ningún mensaje ni dato se guardará en bases de datos (Firestore ni BigQuery). Al cerrar o recargar la pestaña, todo se eliminará definitivamente.",
        timestamp: new Date()
      }])
    }
    setIsPrivacyModalOpen(false)
  }

  // 2. Verificar autenticación y estado de cuidado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        setLoading(false)
        const userDocRef = doc(db, "users", currentUser.uid)
        const unsubDoc = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setIsUnderCare(docSnap.data().isUnderCare || false)
            }
          },
          (error) => {
            console.warn("Snapshot error en userDoc:", error.message)
          }
<<<<<<< Updated upstream
        )
        return () => unsubDoc()
=======
        }, (err) => {
          console.warn("User doc snapshot permission or network warning:", err);
        });
        return () => unsubDoc();
>>>>>>> Stashed changes
      } else {
        setUser(null)
        setLoading(false)
        setPrivacyTier("ANONIMO")
      }
    })

    return () => unsubscribe()
  }, [])

  // 3. Cargar lista de sesiones (Solo si no está en modo Incógnito estricto y hay usuario)
  useEffect(() => {
<<<<<<< Updated upstream
    if (!user) return
    const q = query(collection(db, "users", user.uid, "sessions"), orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Session))
        setSessions(docs)
        // Si no hay sesión seleccionada, no estamos en incógnito y hay sesiones, seleccionar la primera
        if (!currentSessionId && docs.length > 0 && privacyTier !== "INCOGNITO") {
          setCurrentSessionId(docs[0].id)
        }
      },
      (error) => {
        console.warn("Snapshot error en sessions list:", error.message)
      }
    )
    return () => unsubscribe()
  }, [user, privacyTier])
=======
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "sessions"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session));
      setSessions(docs);
      // Si no hay sesión seleccionada y hay sesiones, elegir la primera
      if (!currentSessionId && docs.length > 0) {
        setCurrentSessionId(docs[0].id);
      } else if (docs.length === 0) {
        setMessages([{
          id: "welcome",
          role: "assistant",
          content: `Hola ${user.displayName || "compañero"}, soy la Dra. Alma de LUMEN. Estoy aquí para apoyarte en tu camino en la **UCC**. Ya sea por estrés académico o algo personal, este es tu espacio seguro. ¿Cómo te sientes hoy?`,
          timestamp: new Date()
        }]);
      }
    }, (err) => {
      console.warn("Sessions snapshot permission or network warning:", err);
    });
    return () => unsubscribe();
  }, [user]);
>>>>>>> Stashed changes

  // Crear nueva sesión
  const createNewSession = async () => {
<<<<<<< Updated upstream
    if (privacyTier === "INCOGNITO") {
      setCurrentSessionId(null)
      setMessages([{
        id: "incognito-welcome",
        role: "assistant",
        content: "👻 **Nueva Sesión Incógnita (Efímera)**\n\nEsta conversación no se guarda en ninguna base de datos. Si deseas conservar tu historial o recibir seguimiento de Bienestar Universitario, puedes cambiar al **Modo Anónimo con Historial** o **Modo Identificado** en el botón de privacidad superior.",
        timestamp: new Date()
      }])
      setIsSidebarOpen(false)
      return
    }

    if (!user) return
=======
    if (!user) {
      setMessages([{
        id: "welcome-guest",
        role: "assistant",
        content: "Bienvenido a LUMEN UCC. Como invitado, puedes hablar conmigo de forma privada. ¿Cómo te sientes hoy?",
        timestamp: new Date()
      }]);
      return;
    }
>>>>>>> Stashed changes
    const newSession = await addDoc(collection(db, "users", user.uid, "sessions"), {
      title: "Nueva conversación",
      isAnonymous: privacyTier === "ANONIMO",
      alias: privacyTier === "ANONIMO" ? anonymousAlias : (user.displayName || "Identificado"),
      privacyTier: privacyTier,
      createdAt: serverTimestamp(),
<<<<<<< Updated upstream
    })
    setCurrentSessionId(newSession.id)
    setMessages([])
    setIsSidebarOpen(false)
  }
=======
    });
    setCurrentSessionId(newSession.id);
    setMessages([{
      id: "welcome-new",
      role: "assistant",
      content: `Hola ${user.displayName || "compañero"}, soy la Dra. Alma de LUMEN. Estoy aquí para apoyarte en tu camino en la **UCC**. Ya sea por estrés académico o algo personal, este es tu espacio seguro. ¿Cómo te sientes hoy?`,
      timestamp: new Date()
    }]);
    setIsSidebarOpen(false);
  };
>>>>>>> Stashed changes

  // Eliminar sesión individual (Derecho de Supresión / Habeas Data)
  const handleDeleteSession = async (session: Session) => {
    if (!user) return
    try {
      // 1. Eliminar mensajes dentro de la subcolección
      const messagesRef = collection(db, "users", user.uid, "sessions", session.id, "messages")
      const msgsSnap = await getDocs(messagesRef)
      const batch = writeBatch(db)
      msgsSnap.docs.forEach(mDoc => {
        batch.delete(mDoc.ref)
      })
      // 2. Eliminar el documento de la sesión
      batch.delete(doc(db, "users", user.uid, "sessions", session.id))
      await batch.commit()

      // Si la sesión eliminada era la actual, limpiar vista
      if (currentSessionId === session.id) {
        setCurrentSessionId(null)
        setMessages([])
      }
      setSessionToDelete(null)
    } catch (error) {
      console.error("Error al eliminar la sesión:", error)
    }
  }

  // Purgar todo el historial del usuario (Derecho al Olvido / Ley 1581 de 2012)
  const handlePurgeAllHistory = async () => {
    if (!user) return
    setIsPurgingAll(true)
    try {
      const sessionsRef = collection(db, "users", user.uid, "sessions")
      const sessionsSnap = await getDocs(sessionsRef)
      
      for (const sDoc of sessionsSnap.docs) {
        const msgsRef = collection(db, "users", user.uid, "sessions", sDoc.id, "messages")
        const msgsSnap = await getDocs(msgsRef)
        const batch = writeBatch(db)
        msgsSnap.docs.forEach(m => batch.delete(m.ref))
        batch.delete(sDoc.ref)
        await batch.commit()
      }

      setCurrentSessionId(null)
      setMessages([{
        id: "purged",
        role: "assistant",
        content: "✅ **Historial purgado exitosamente.**\n\nEn cumplimiento de la **Ley 1581 de 2012 (Habeas Data)** y tu derecho de supresión de datos personales, todas tus sesiones y mensajes han sido eliminados de nuestros servidores de forma permanente.",
        timestamp: new Date()
      }])
      setPurgeSuccess(true)
      setTimeout(() => setPurgeSuccess(false), 4000)
    } catch (error) {
      console.error("Error al purgar historial:", error)
    } finally {
      setIsPurgingAll(false)
    }
  }

  // 4. Cargar mensajes de la sesión actual en Firestore
  useEffect(() => {
    if (privacyTier === "INCOGNITO") {
      // En modo incógnito, no leemos de Firestore
      return
    }

    if (!user || !currentSessionId) return

    const q = query(
      collection(db, "users", user.uid, "sessions", currentSessionId, "messages"), 
      orderBy("timestamp", "asc")
    )
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedMessages = snapshot.docs.map(docSnap => {
          const data = docSnap.data({ serverTimestamps: 'estimate' })
          return {
            id: docSnap.id,
            role: data.role,
            content: data.content,
            timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(),
          } as Message
        })
        
        if (loadedMessages.length === 0) {
          let greetingName = user.displayName || "compañero"
          let privacyText = "Estás en **Modo Identificado**. Tu historial se asocia a tu perfil para acompañamiento integral de Bienestar Universitario."

          if (privacyTier === "ANONIMO") {
            greetingName = anonymousAlias || "amigo"
            privacyText = `Estás en **Modo Anónimo (Privacidad Protegida)** bajo el alias **${anonymousAlias}**. Tu nombre y correo permanecen ocultos para los psicólogos.`
          }

          setMessages([{
            id: "welcome",
            role: "assistant",
            content: `Hola ${greetingName}, soy la Dra. Alma de LUMEN. Estoy aquí para acompañarte en tu vida universitaria en la **UCC**.\n\n${privacyText}\n\n¿Cómo te sientes hoy?`,
            timestamp: new Date()
          }])
        } else {
          setMessages(loadedMessages)
        }
      },
      (error) => {
        console.warn("Snapshot error en messages:", error.message)
      }
<<<<<<< Updated upstream
    )
=======
    }, (err) => {
      console.warn("Messages snapshot permission or network warning:", err);
    });
>>>>>>> Stashed changes

    return () => unsubscribe()
  }, [user, currentSessionId, privacyTier, anonymousAlias])

  // Inicialización para invitados UCC sin sesión
  useEffect(() => {
    if (!user && !loading && privacyTier !== "INCOGNITO") {
      setMessages([{
        id: "guest-welcome",
        role: "assistant",
        content: "Bienvenido a LUMEN UCC. Como invitado, estás en un espacio seguro y protegido. Puedes hablar conmigo libremente. Si eres estudiante de la **Universidad Cooperativa de Colombia**, te sugerimos iniciar sesión para acceder a acompañamiento personalizado.",
        timestamp: new Date()
      }])
    }
  }, [user, loading, privacyTier])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 5. Enviar mensaje
  const handleSend = async (text?: string) => {
    const messageText = text || input
    if (!messageText.trim()) return

    try {
      setInput("")
      setIsTyping(true)

      const newUserMsg: Message = { 
        id: Date.now().toString(), 
        role: "user", 
        content: messageText, 
        timestamp: new Date() 
      }

      // ==========================================
      // CASO A: MODO INCÓGNITO (CERO PERSISTENCIA EN BD)
      // ==========================================
      if (privacyTier === "INCOGNITO") {
        setMessages(prev => [...prev, newUserMsg])

        // Formar historial para Gemini
        const geminiMessages = messages.concat(newUserMsg)
          .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))

        const data = await chatWithGemini(geminiMessages)
        const botResponse = data.response || "Lo siento, tuve un problema al procesar tu mensaje."
        
        const newBotMsg: Message = { 
          id: (Date.now() + 1).toString(), 
          role: "assistant", 
          content: botResponse, 
          timestamp: new Date() 
        }
        setMessages(prev => [...prev, newBotMsg])
        setIsTyping(false)
        return
      }

      // ==========================================
      // CASO B: MODO IDENTIFICADO O ANÓNIMO CON HISTORIAL
      // ==========================================
      let sessionId = currentSessionId
      if (user && !sessionId) {
        const newSession = await addDoc(collection(db, "users", user.uid, "sessions"), {
          title: messageText.slice(0, 30) + (messageText.length > 30 ? "..." : ""),
          isAnonymous: privacyTier === "ANONIMO",
          alias: privacyTier === "ANONIMO" ? anonymousAlias : (user.displayName || "Identificado"),
          privacyTier: privacyTier,
          createdAt: serverTimestamp(),
        })
        sessionId = newSession.id
        setCurrentSessionId(sessionId)
      }

      if (!user) {
        setMessages(prev => [...prev, newUserMsg])
      }

      // 1. Guardar mensaje del usuario en Firestore
      if (user && sessionId) {
        await addDoc(collection(db, "users", user.uid, "sessions", sessionId, "messages"), {
          role: "user",
          content: messageText,
          timestamp: serverTimestamp(),
        })
        
        // Actualizar título de la sesión si es el primer mensaje
        if (messages.length <= 1) {
          await updateDoc(doc(db, "users", user.uid, "sessions", sessionId), {
            title: messageText.slice(0, 30) + (messageText.length > 30 ? "..." : "")
          })
        }

        // 2. Registrar en BigQuery
        logToBigQuery({
          user_id: privacyTier === "ANONIMO" ? `anon_${user.uid.slice(0, 8)}` : user.uid,
          session_id: sessionId,
          role: "user",
          content: messageText,
          timestamp: new Date().toISOString()
        })
      }

      // 3. Supervisión humana en curso
      if (isUnderCare) {
        setIsTyping(false)
        return
      }

      // 4. Inferencia con IA
      const geminiMessages = messages.concat(newUserMsg)
        .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))

      const data = await chatWithGemini(geminiMessages)
      const botResponse = data.response || "Lo siento, tuve un problema al procesar tu mensaje."
      const riskLevel = (data.risk_level || "BAJO").toUpperCase()
      const riskAnalysis = data.risk_analysis || ""
      const riskConfidence = data.risk_confidence || (riskLevel === "ALTO" ? 92 : riskLevel === "MEDIO" ? 84 : 88)
      const emotions = data.emotions || null
      const themes = data.themes || []
      const triggers = data.triggers || []
      const behavioralChanges = data.behavioral_changes || []
      const contradictions = data.contradictions || []

      // 5. Alerta ALTO (Alineada con nivel de privacidad)
      if (riskLevel === "ALTO") {
        let currentTitle = "Chat sin título"
        if (user && sessionId) {
          const sDoc = await getDoc(doc(db, "users", user.uid, "sessions", sessionId))
          if (sDoc.exists()) currentTitle = sDoc.data().title
        }

        await addDoc(collection(db, "emergency_alerts"), {
          userId: user?.uid || "invitado",
          sessionId: sessionId || "invitado",
          sessionTitle: currentTitle,
          isAnonymous: privacyTier === "ANONIMO",
          userName: privacyTier === "ANONIMO" 
            ? `${anonymousAlias || "Estudiante Anónimo"} (Modo Anónimo)` 
            : (user?.displayName || "Usuario Invitado"),
          userEmail: privacyTier === "ANONIMO" 
            ? "Protegido por Modo Anónimo (Ley 1581)" 
            : (user?.email || "sin-email@lumen.com"),
          message: messageText,
          riskAnalysis: riskAnalysis,
          risk_level: riskLevel,
          risk_confidence: riskConfidence,
          emotions: emotions,
          themes: themes,
          triggers: triggers,
          behavioral_changes: behavioralChanges,
          contradictions: contradictions,
          timestamp: serverTimestamp(),
          status: "PENDIENTE",
        })
      }

      // 6. Guardar respuesta del asistente en Firestore y BigQuery
      const newBotMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: "assistant", 
        content: botResponse, 
        timestamp: new Date() 
      }
      if (!user) setMessages(prev => [...prev, newBotMsg])

      if (user && sessionId) {
        await addDoc(collection(db, "users", user.uid, "sessions", sessionId, "messages"), {
          role: "assistant",
          content: botResponse,
          risk_level: riskLevel,
          risk_confidence: riskConfidence,
          risk_analysis: riskAnalysis,
          explanation: data.explanation || riskAnalysis,
          emotions: emotions,
          themes: themes,
          triggers: triggers,
          behavioral_changes: behavioralChanges,
          contradictions: contradictions,
          therapeutic_technique: data.therapeutic_technique || null,
          follow_up_question: data.follow_up_question || null,
          timestamp: serverTimestamp(),
        })

        logToBigQuery({
          user_id: privacyTier === "ANONIMO" ? `anon_${user.uid.slice(0, 8)}` : user.uid,
          session_id: sessionId,
          role: "assistant",
          content: botResponse,
          risk_level: riskLevel,
          risk_confidence: riskConfidence,
          timestamp: new Date().toISOString()
        })
      }

    } catch (error) {
      console.error("Error en el chat:", error)
    } finally {
      setIsTyping(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">Iniciando espacio seguro...</p>
        </div>
      </div>
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">

      {/* Sidebar - Desktop & Mobile */}
      <AnimatePresence>
        {(isSidebarOpen || (typeof window !== 'undefined' && window.innerWidth > 768)) && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className={cn(
              "fixed md:relative z-50 w-[280px] h-full bg-card border-r-2 border-border flex flex-col transition-all duration-300",
              !isSidebarOpen && "hidden md:flex"
            )}
          >
            <div className="p-4 pt-24 md:pt-8">
              <Button 
                onClick={createNewSession}
                className="w-full justify-start gap-3 h-12 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 border-0 shadow-none font-bold"
              >
                <Plus className="h-5 w-5" />
                {privacyTier === "INCOGNITO" ? "Nueva Sesión Efímera" : "Nuevo Chat"}
              </Button>
            </div>

            {/* Lista de Sesiones Guardadas */}
            <div className="flex-1 overflow-y-auto px-2 space-y-1">
              <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-between">
                <span>Historial en Servidor</span>
                {sessions.length > 0 && (
                  <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                    {sessions.length}
                  </span>
                )}
              </div>

              {privacyTier === "INCOGNITO" && (
                <div className="p-3 mx-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-700 dark:text-amber-400">
                  <p className="font-bold flex items-center gap-1.5 mb-1">
                    <Ghost className="h-3.5 w-3.5" /> Modo Incógnito
                  </p>
                  <p className="text-[10px] leading-tight text-muted-foreground">
                    Tus chats actuales son efímeros y no se listarán aquí.
                  </p>
                </div>
              )}

              {sessions.length === 0 && privacyTier !== "INCOGNITO" && (
                <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  No tienes conversaciones guardadas.
                </div>
              )}

              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group relative",
                    currentSessionId === session.id 
                      ? "bg-primary/10 text-primary border-l-4 border-primary" 
                      : "hover:bg-accent text-muted-foreground"
                  )}
                >
                  <button
                    onClick={() => {
                      setCurrentSessionId(session.id)
                      setIsSidebarOpen(false)
                    }}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <div className="flex-1 truncate">
                      <span className="text-sm truncate block font-medium">{session.title}</span>
                      {session.isAnonymous && (
                        <span className="text-[10px] text-purple-500 font-semibold flex items-center gap-1">
                          <Shield className="h-2.5 w-2.5" /> Anónimo ({session.alias || "Protegido"})
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Botón de Derecho de Supresión (Eliminar Sesión) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSessionToDelete(session)
                    }}
                    title="Eliminar esta conversación (Derecho de Supresión)"
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer del Sidebar con estado de Privacidad */}
            <div className="p-4 border-t border-border space-y-2">
              <button
                onClick={() => setIsPrivacyModalOpen(true)}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-accent transition-all text-left group"
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-transform group-hover:scale-110",
                  privacyTier === "IDENTIFICADO" && "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300",
                  privacyTier === "ANONIMO" && "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300",
                  privacyTier === "INCOGNITO" && "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300"
                )}>
                  {privacyTier === "IDENTIFICADO" && <UserCheck className="h-4 w-4" />}
                  {privacyTier === "ANONIMO" && <ShieldCheck className="h-4 w-4" />}
                  {privacyTier === "INCOGNITO" && <Ghost className="h-4 w-4" />}
                </div>
                <div className="flex-1 truncate">
                  <p className="text-xs font-bold truncate flex items-center justify-between">
                    <span>
                      {privacyTier === "IDENTIFICADO" && (user?.displayName || "Usuario Identificado")}
                      {privacyTier === "ANONIMO" && (anonymousAlias || "Modo Anónimo")}
                      {privacyTier === "INCOGNITO" && "Modo Incógnito"}
                    </span>
                    <Settings className="h-3 w-3 text-muted-foreground opacity-50" />
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {privacyTier === "IDENTIFICADO" && "Historial Vinculado"}
                    {privacyTier === "ANONIMO" && "Alias Protegido"}
                    {privacyTier === "INCOGNITO" && "Cero Persistencia"}
                  </p>
                </div>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative h-screen">
        {/* Overlay móvil */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Chat Header */}
        <header className="h-16 md:h-20 border-b border-border flex items-center justify-between px-4 md:px-8 bg-background/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hover:bg-primary/10 text-primary"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <Link href="/" className="flex md:hidden items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h1 className="font-serif font-bold text-base leading-tight">LUMEN</h1>
                <p className="text-[9px] text-emerald-500 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  UCC
                </p>
              </div>
            </Link>
          </div>
<<<<<<< Updated upstream

          {/* Badge y Selector de Privacidad / Habeas Data */}
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => {
                setAliasInput(anonymousAlias)
                setIsPrivacyModalOpen(true)
              }}
              title="Configurar Privacidad y Habeas Data (Ley 1581 de 2012)"
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-xs font-semibold transition-all shadow-sm hover:scale-105 active:scale-95",
                privacyTier === "IDENTIFICADO" && "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300",
                privacyTier === "ANONIMO" && "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300",
                privacyTier === "INCOGNITO" && "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300"
              )}
            >
              {privacyTier === "IDENTIFICADO" && (
                <>
                  <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="text-left hidden sm:block">
                    <span className="block text-[9px] uppercase font-bold text-emerald-600">Identificado</span>
                    <span className="block text-[11px] leading-tight font-bold truncate max-w-[120px]">{user?.displayName || "Mi Perfil UCC"}</span>
                  </div>
                  <span className="sm:hidden font-bold">Identificado</span>
                </>
              )}

              {privacyTier === "ANONIMO" && (
                <>
                  <ShieldCheck className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <div className="text-left hidden sm:block">
                    <span className="block text-[9px] uppercase font-bold text-purple-500">Anónimo</span>
                    <span className="block text-[11px] leading-tight font-bold truncate max-w-[120px]">{anonymousAlias || "Alias Protegido"}</span>
                  </div>
                  <span className="sm:hidden font-bold">Anónimo</span>
                </>
              )}

              {privacyTier === "INCOGNITO" && (
                <>
                  <Ghost className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div className="text-left hidden sm:block">
                    <span className="block text-[9px] uppercase font-bold text-amber-600">Incógnito</span>
                    <span className="block text-[11px] leading-tight font-bold">Sesión Efímera</span>
                  </div>
                  <span className="sm:hidden font-bold">Incógnito</span>
                </>
              )}

              <Settings className="h-3 w-3 opacity-60 ml-0.5" />
            </button>

=======
          <div className="md:hidden">
>>>>>>> Stashed changes
            <Link href="/emergency">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl bg-destructive/5 border-destructive/20 text-destructive hover:bg-destructive/10 text-xs font-bold"
              >
<<<<<<< Updated upstream
                <Phone className="h-3 w-3 mr-1 md:mr-2" />
                <span className="hidden sm:inline">EMERGENCIA</span>
                <span className="sm:hidden">SOS</span>
=======
                <Phone className="h-3 w-3 mr-2" />
                EMERGENCIA
>>>>>>> Stashed changes
              </Button>
            </Link>
          </div>
        </header>

        {/* Banner para Modo Incógnito */}
        {privacyTier === "INCOGNITO" && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-2">
              <Ghost className="h-4 w-4 shrink-0" />
              <span>
                <strong>Modo Incógnito Activo:</strong> Esta conversación no se guarda en ninguna base de datos y se destruirá al salir.
              </span>
            </div>
            <button
              onClick={() => setIsPrivacyModalOpen(true)}
              className="text-[11px] font-bold underline hover:opacity-80 shrink-0 ml-2"
            >
              Cambiar Modo
            </button>
          </div>
        )}

        {/* Banner de Supervisión Profesional */}
        {isUnderCare && (
          <div className="bg-primary/5 border-b border-primary/10 p-2 text-center">
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center justify-center gap-2">
              <ShieldAlert className="h-3 w-3" />
              Un profesional de psicología está supervisando esta sesión
            </p>
          </div>
        )}

<<<<<<< Updated upstream
        {/* Mensajes del Chat */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
=======
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-6 md:pt-10 pb-6 space-y-6">
>>>>>>> Stashed changes
          <div className="max-w-3xl mx-auto w-full">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex mb-6", message.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div className={cn(
                    "max-w-[85%] md:max-w-[75%] p-4 rounded-3xl",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none shadow-lg shadow-primary/10"
                      : message.content.includes("[PROFESIONAL]")
                        ? "bg-primary/5 border-2 border-primary/20 text-foreground rounded-tl-none ring-4 ring-primary/5"
                        : "bg-card border-2 border-border rounded-tl-none"
                  )}>
                    {message.content.includes("[PROFESIONAL]") && (
                      <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-primary uppercase tracking-widest">
                        <UserCircle className="h-3.5 w-3.5" />
                        Psicólogo Profesional
                      </div>
                    )}
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:bg-muted prose-pre:text-muted-foreground">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                          li: ({node, ...props}) => <li className="mb-1" {...props} />,
                        }}
                      >
                        {message.content.replace("[PROFESIONAL] ", "")}
                      </ReactMarkdown>
                    </div>
                    <p className={cn(
                      "text-[10px] mt-2 opacity-50",
                      message.role === "user" ? "text-right" : "text-left"
                    )}>
                      {message.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-card border-2 border-border rounded-3xl rounded-tl-none px-4 py-3">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <motion.div key={i} className="w-1.5 h-1.5 bg-primary/40 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.2 }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-8 bg-background/80 backdrop-blur-md border-t border-border">
          <div className="max-w-3xl mx-auto">
            {messages.length <= 2 && (
              <div className="flex flex-wrap gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                {quickReplies.map((reply) => (
                  <Button
                    key={reply}
                    variant="outline"
                    size="sm"
                    className="rounded-xl whitespace-nowrap bg-background"
                    onClick={() => handleSend(reply)}
                  >
                    {reply}
                  </Button>
                ))}
              </div>
            )}
            
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={privacyTier === "INCOGNITO" ? "Escribe tu mensaje en modo incógnito (no se guardará)..." : "¿Cómo te sientes en esta sesión?"}
                  rows={1}
                  className="w-full resize-none rounded-2xl border-2 border-border bg-card px-4 py-3 pr-12 text-sm focus:outline-none focus:border-primary transition-all max-h-32"
                />
                <Button variant="ghost" size="icon" className="absolute right-2 bottom-2 text-muted-foreground hover:text-primary">
                  <Smile className="h-5 w-5" />
                </Button>
              </div>
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="h-12 w-12 rounded-2xl shadow-lg shadow-primary/20"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* ======================================================== */}
      {/* MODAL DE PRIVACIDAD, ANONIMATO Y HABEAS DATA (LEY 1581) */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isPrivacyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-card border-2 border-border rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-foreground">
                      Privacidad y Protección de Datos
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Cumplimiento con Ley Estatutaria 1581 de 2012 (Habeas Data) & Código Deontológico
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPrivacyModalOpen(false)}
                  className="w-9 h-9 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground flex items-center justify-center transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Tabs de Navegación del Modal */}
              <div className="flex border-b border-border px-6 shrink-0 bg-muted/20">
                <button
                  onClick={() => setActivePrivacyTab("modos")}
                  className={cn(
                    "py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2",
                    activePrivacyTab === "modos"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Nivel de Identificación (3 Modos)
                </button>
                <button
                  onClick={() => setActivePrivacyTab("habeas_data")}
                  className={cn(
                    "py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2",
                    activePrivacyTab === "habeas_data"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <FileText className="h-4 w-4" />
                  Derechos de Habeas Data & Supresión
                </button>
              </div>

              {/* Contenido con Scroll */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {activePrivacyTab === "modos" ? (
                  <>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      En LUMEN respetamos tu autonomía. Puedes seleccionar libremente el nivel de privacidad y visibilidad con el que deseas interactuar:
                    </p>

                    {/* Opción 1: Modo Identificado */}
                    <div
                      onClick={() => handleSavePrivacyMode("IDENTIFICADO")}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 relative",
                        privacyTier === "IDENTIFICADO"
                          ? "border-emerald-500 bg-emerald-500/10 shadow-sm"
                          : "border-border hover:border-emerald-300 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20"
                      )}
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                        <UserCheck className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                            Modo Identificado
                            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                              Recomendado para seguimiento
                            </span>
                          </h4>
                          {privacyTier === "IDENTIFICADO" && <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 font-bold" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          Tus sesiones se asocian a tu perfil universitario (<strong>{user?.displayName || "Estudiante UCC"}</strong>). Permite a los psicólogos de Bienestar brindarte seguimiento integral y citas presenciales.
                        </p>
                      </div>
                    </div>

                    {/* Opción 2: Modo Anónimo con Historial */}
                    <div
                      onClick={() => handleSavePrivacyMode("ANONIMO", aliasInput)}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 relative",
                        privacyTier === "ANONIMO"
                          ? "border-purple-500 bg-purple-500/10 shadow-sm"
                          : "border-border hover:border-purple-300 hover:bg-purple-50/30 dark:hover:bg-purple-950/20"
                      )}
                    >
                      <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                            Modo Anónimo con Historial
                            <span className="text-[10px] bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold">
                              Privacidad Protegida
                            </span>
                          </h4>
                          {privacyTier === "ANONIMO" && <Check className="h-4 w-4 text-purple-600 dark:text-purple-400 font-bold" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          Conservas tu historial para no perder el hilo de tus conversaciones, pero frente a los psicólogos y reportes tu identidad se reemplaza por un alias protegido (<strong>{anonymousAlias}</strong>). Tu nombre y correo nunca se muestran.
                        </p>

                        {/* Configuración de Alias */}
                        {privacyTier === "ANONIMO" && (
                          <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800/40" onClick={(e) => e.stopPropagation()}>
                            <label className="text-[11px] font-bold text-purple-700 dark:text-purple-300 block mb-1">
                              Personalizar Alias Anónimo:
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={aliasInput}
                                onChange={(e) => setAliasInput(e.target.value)}
                                placeholder="Ej: Estudiante UCC #1234 o Fénix"
                                className="flex-1 bg-background border border-purple-200 dark:border-purple-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-purple-500"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleSavePrivacyMode("ANONIMO", aliasInput)}
                                className="h-8 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs px-3"
                              >
                                Guardar Alias
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Opción 3: Modo Incógnito (Cero Persistencia) */}
                    <div
                      onClick={() => handleSavePrivacyMode("INCOGNITO")}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 relative",
                        privacyTier === "INCOGNITO"
                          ? "border-amber-500 bg-amber-500/10 shadow-sm"
                          : "border-border hover:border-amber-300 hover:bg-amber-50/30 dark:hover:bg-amber-950/20"
                      )}
                    >
                      <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                        <Ghost className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                            Modo Incógnito (Sesión Efímera)
                            <span className="text-[10px] bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">
                              Cero Almacenamiento
                            </span>
                          </h4>
                          {privacyTier === "INCOGNITO" && <Check className="h-4 w-4 text-amber-600 dark:text-amber-400 font-bold" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          <strong>Privacidad absoluta en memoria.</strong> Ningún mensaje se almacena en Firestore ni en BigQuery. La conversación se destruye permanentemente al cerrar la pestaña o recargar el navegador.
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  /* PESTAÑA: HABEAS DATA Y DERECHO AL OLVIDO */
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/40 rounded-2xl border border-border space-y-2">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-2">
                        <Info className="h-4 w-4 text-primary" />
                        Tus Derechos según la Ley 1581 de 2012 (Colombia)
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Como titular de datos personales en LUMEN (Universidad Cooperativa de Colombia), tienes derecho en cualquier momento a:
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                        <li><strong>Conocer, actualizar y rectificar</strong> tus datos personales registrados.</li>
                        <li><strong>Revocar la autorización</strong> o solicitar la supresión de tus registros cuando consideres que no se respetan los principios legales.</li>
                        <li><strong>Elegir el anonimato o modo efímero</strong> para tus consultas de salud mental.</li>
                      </ul>
                    </div>

                    {/* Botón de Purgar Todo el Historial */}
                    <div className="p-4 rounded-2xl border-2 border-destructive/20 bg-destructive/5 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0 mt-0.5">
                          <Trash2 className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-bold text-xs text-destructive uppercase">
                            Derecho de Supresión Total (Purgar Historial)
                          </h5>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            Si deseas eliminar todas tus conversaciones, análisis y mensajes almacenados en la base de datos de LUMEN, puedes ejecutar el borrado definitivo con este botón. Esta acción no se puede deshacer.
                          </p>
                        </div>
                      </div>

                      {purgeSuccess && (
                        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2">
                          <Check className="h-4 w-4" />
                          ¡Todo tu historial ha sido eliminado permanentemente de nuestros servidores!
                        </div>
                      )}

                      <Button
                        onClick={handlePurgeAllHistory}
                        disabled={isPurgingAll || sessions.length === 0}
                        variant="destructive"
                        className="w-full rounded-xl text-xs font-bold gap-2"
                      >
                        {isPurgingAll ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Eliminando todos tus datos...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4" />
                            Eliminar Definitivamente Todo mi Historial ({sessions.length} conversaciones)
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Modal */}
              <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between shrink-0">
                <p className="text-[10px] text-muted-foreground max-w-xs">
                  Seguridad end-to-end con encriptación en tránsito y reposo.
                </p>
                <Button
                  onClick={() => setIsPrivacyModalOpen(false)}
                  className="rounded-xl px-6 text-xs font-bold"
                >
                  Aceptar y Continuar
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* MODAL DE CONFIRMACIÓN DE BORRADO DE SESIÓN INDIVIDUAL    */}
      {/* ======================================================== */}
      <AnimatePresence>
        {sessionToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border-2 border-border rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-bold text-base text-foreground">
                  ¿Eliminar esta conversación?
                </h3>
                <p className="text-xs text-muted-foreground">
                  Se eliminará permanentemente la sesión <strong>&quot;{sessionToDelete.title}&quot;</strong> y todos sus mensajes de la base de datos (Derecho de Supresión Ley 1581).
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setSessionToDelete(null)}
                  className="flex-1 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteSession(sessionToDelete)}
                  className="flex-1 rounded-xl text-xs font-bold"
                >
                  Eliminar Sesión
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
