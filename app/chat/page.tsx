"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import { FloatingNav } from "@/components/floating-nav"
import { Button } from "@/components/ui/button"
import { Send, Sparkles, Phone, Mic, Smile, ShieldAlert, UserCircle, MessageSquare, Plus, History, Menu, Trash2, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { db, auth } from "@/lib/firebase"
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp, doc, updateDoc, getDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
}

const quickReplies = [
  "Me siento ansioso",
  "Necesito hablar",
  "Tengo estres",
  "No puedo dormir",
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Verificar autenticación y estado de cuidado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
        // Escuchar cambios en el estado de intervención del usuario
        const userDocRef = doc(db, "users", currentUser.uid);
        const unsubDoc = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setIsUnderCare(doc.data().isUnderCare || false);
          }
        });
        return () => unsubDoc();
      } else {
        setLoading(false);
        // Ya no redirigimos al login, permitimos modo invitado
      }
    });

    return () => unsubscribe();
  }, []);

  // Cargar lista de sesiones
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "sessions"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session));
      setSessions(docs);
      // Si no hay sesión seleccionada y hay sesiones, elegir la primera
      if (!currentSessionId && docs.length > 0) {
        setCurrentSessionId(docs[0].id);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const createNewSession = async () => {
    if (!user) return;
    const newSession = await addDoc(collection(db, "users", user.uid, "sessions"), {
      title: "Nueva conversación",
      createdAt: serverTimestamp(),
    });
    setCurrentSessionId(newSession.id);
    setMessages([]);
    setIsSidebarOpen(false);
  };

  // Cargar mensajes de la sesión actual
  useEffect(() => {
    if (!user || !currentSessionId) return;

    const q = query(
      collection(db, "users", user.uid, "sessions", currentSessionId, "messages"), 
      orderBy("timestamp", "asc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages = snapshot.docs.map(doc => {
        const data = doc.data({ serverTimestamps: 'estimate' });
        return {
          id: doc.id,
          role: data.role,
          content: data.content,
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(),
        } as Message;
      });
      
      if (loadedMessages.length === 0) {
        setMessages([{
          id: "welcome",
          role: "assistant",
          content: `Hola ${user.displayName || "compañero"}, soy la Dra. Alma de LUMEN. Estoy aquí para apoyarte en tu camino en la **UCC**. Ya sea por estrés académico o algo personal, este es tu espacio seguro. ¿Cómo te sientes hoy?`,
          timestamp: new Date()
        }]);
      } else {
        setMessages(loadedMessages);
      }
    });

    return () => unsubscribe();
  }, [user, currentSessionId])

  // Inicialización para invitados UCC
  useEffect(() => {
    if (!user && !loading) {
      setMessages([{
        id: "guest-welcome",
        role: "assistant",
        content: "Bienvenido a LUMEN UCC. Como invitado, puedes hablar conmigo de forma privada. Si eres estudiante de la **Universidad Cooperativa de Colombia**, te sugiero iniciar sesión para guardar tu proceso.",
        timestamp: new Date()
      }]);
    }
  }, [user, loading]);

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (text?: string) => {
    const messageText = text || input
    if (!messageText.trim()) return

    // Asegurar que hay una sesión para usuarios registrados
    let sessionId = currentSessionId;
    if (user && !sessionId) {
      const newSession = await addDoc(collection(db, "users", user.uid, "sessions"), {
        title: messageText.slice(0, 30) + (messageText.length > 30 ? "..." : ""),
        createdAt: serverTimestamp(),
      });
      sessionId = newSession.id;
      setCurrentSessionId(sessionId);
    }

    const userMessageData = {
      role: "user" as const,
      content: messageText,
      timestamp: serverTimestamp(),
    }

    try {
      setInput("")
      setIsTyping(true)

      // Actualizar UI local inmediatamente
      const newUserMsg: Message = { id: Date.now().toString(), role: "user", content: messageText, timestamp: new Date() };
      if (!user) setMessages(prev => [...prev, newUserMsg]);

      // 1. Guardar en Firestore (SOLO SI HAY USUARIO Y SESION)
      if (user && sessionId) {
        await addDoc(collection(db, "users", user.uid, "sessions", sessionId, "messages"), userMessageData);
        
        // Actualizar título de la sesión si es el primer mensaje
        if (messages.length <= 1) {
          await updateDoc(doc(db, "users", user.uid, "sessions", sessionId), {
            title: messageText.slice(0, 30) + (messageText.length > 30 ? "..." : "")
          });
        }

        // 2. Registrar en BigQuery
        fetch('http://localhost:8081/api/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.uid,
            session_id: sessionId,
            role: "user",
            content: messageText,
            timestamp: new Date().toISOString()
          })
        }).catch(err => console.error("Error logging to BigQuery:", err));
      }

      // 3. Obtener respuesta de Gemini Service (SOLO SI NO HAY INTERVENCION HUMANA)
      if (isUnderCare) {
        setIsTyping(false);
        return;
      }

      const response = await fetch('http://localhost:8080/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.concat(newUserMsg)
            .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
        })
      });

      const data = await response.json();
      const botResponse = data.response || "Lo siento, tuve un problema al procesar tu mensaje.";
      const riskLevel = (data.risk_level || "BAJO").toUpperCase();
      const riskAnalysis = data.risk_analysis || "";

      console.log("🔍 Análisis de Riesgo LUMEN:", { riskLevel, riskAnalysis });

      // 4. Alerta ALTO (Incluye sessionId y sessionTitle)
      if (riskLevel === "ALTO") {
        console.log("🚨 ALERTA ROJA DETECTADA - Enviando a Dashboard...");
        // Obtener el título de la sesión actual
        let currentTitle = "Chat sin título";
        if (user && sessionId) {
          const sDoc = await getDoc(doc(db, "users", user.uid, "sessions", sessionId));
          if (sDoc.exists()) currentTitle = sDoc.data().title;
        }

        await addDoc(collection(db, "emergency_alerts"), {
          userId: user?.uid || "invitado",
          sessionId: sessionId || "invitado",
          sessionTitle: currentTitle,
          userName: user?.displayName || "Usuario Invitado",
          userEmail: user?.email || "sin-email@lumen.com",
          message: messageText,
          riskAnalysis: riskAnalysis,
          timestamp: serverTimestamp(),
          status: "PENDIENTE",
        });
      }

      // 5. Guardar respuesta
      const newBotMsg: Message = { id: (Date.now()+1).toString(), role: "assistant", content: botResponse, timestamp: new Date() };
      if (!user) setMessages(prev => [...prev, newBotMsg]);

      if (user && sessionId) {
        await addDoc(collection(db, "users", user.uid, "sessions", sessionId, "messages"), {
          role: "assistant",
          content: botResponse,
          risk_level: riskLevel,
          timestamp: serverTimestamp(),
        });

        fetch('http://localhost:8081/api/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.uid,
            session_id: sessionId,
            role: "assistant",
            content: botResponse,
            risk_level: riskLevel,
            timestamp: new Date().toISOString()
          })
        }).catch(err => console.error("Error logging assistant to BigQuery:", err));
      }

    } catch (error) {
      console.error("Error en el chat:", error);
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
    );
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      <FloatingNav />

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
                Nuevo Chat
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 space-y-1">
              <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recientes</div>
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => {
                    setCurrentSessionId(session.id);
                    setIsSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group",
                    currentSessionId === session.id 
                      ? "bg-primary/10 text-primary border-l-4 border-primary" 
                      : "hover:bg-accent text-muted-foreground"
                  )}
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <span className="text-sm truncate text-left flex-1">{session.title}</span>
                </button>
              ))}
            </div>

            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <UserCircle className="h-5 w-5" />
                </div>
                <div className="flex-1 truncate">
                  <p className="text-xs font-bold truncate">{user?.displayName || "Usuario"}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative h-screen">
        {/* Overlay para móvil cuando sidebar está abierto */}
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
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-serif font-bold text-lg leading-tight">LUMEN</h1>
                <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  BIENESTAR ESTUDIANTIL UCC
                </p>
              </div>
            </Link>
          </div>
          <Link href="/emergency">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl bg-destructive/5 border-destructive/20 text-destructive hover:bg-destructive/10 text-xs font-bold"
            >
              <Phone className="h-3 w-3 mr-2" />
              EMERGENCIA
            </Button>
          </Link>
        </header>

        {isUnderCare && (
          <div className="bg-primary/5 border-b border-primary/10 p-2 text-center">
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center justify-center gap-2">
              <ShieldAlert className="h-3 w-3" />
              Un profesional está supervisando esta sesión
            </p>
          </div>
        )}

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
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
                  placeholder="¿Cómo te sientes en esta sesión?"
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
    </div>
  )
}
