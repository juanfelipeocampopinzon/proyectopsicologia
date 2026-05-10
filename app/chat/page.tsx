"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import { FloatingNav } from "@/components/floating-nav"
import { Button } from "@/components/ui/button"
import { Send, Sparkles, Phone, Mic, Smile, ShieldAlert, UserCircle } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { db, auth } from "@/lib/firebase"
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp, doc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const quickReplies = [
  "Me siento ansioso",
  "Necesito hablar",
  "Tengo estres",
  "No puedo dormir",
]

export default function ChatPage() {
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

  // Cargar mensajes desde Firestore filtrados por usuario
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "users", user.uid, "chat_history"), 
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
          content: `Hola ${user.displayName || "amigo"}, soy LUMEN. Estoy aqui para escucharte sin juzgar. ¿Como te sientes hoy?`,
          timestamp: new Date()
        }]);
      } else {
        setMessages(loadedMessages);
      }
    });

    return () => unsubscribe();
  }, [user])

  // Inicialización para invitados
  useEffect(() => {
    if (!user && !loading) {
      setMessages([{
        id: "guest-welcome",
        role: "assistant",
        content: "Hola, soy LUMEN. Como invitado, nuestra conversación es privada y no se guardará. Si deseas mantener un historial, por favor inicia sesión.",
        timestamp: new Date()
      }]);
    }
  }, [user, loading]);

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (text?: string) => {
    const messageText = text || input
    if (!messageText.trim() || !user) return

    const userMessageData = {
      role: "user" as const,
      content: messageText,
      timestamp: serverTimestamp(),
    }

    try {
      setInput("")
      setIsTyping(true)

      // Actualizar UI local inmediatamente para feedback rápido
      const newUserMsg: Message = { id: Date.now().toString(), role: "user", content: messageText, timestamp: new Date() };
      if (!user) setMessages(prev => [...prev, newUserMsg]);

      // 1. Guardar en Firestore privado (SOLO SI HAY USUARIO)
      if (user) {
        await addDoc(collection(db, "users", user.uid, "chat_history"), userMessageData);
        
        // 2. Registrar en BigQuery
        fetch('http://localhost:8081/api/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.uid,
            role: "user",
            content: messageText,
            timestamp: new Date().toISOString()
          })
        }).catch(err => console.error("Error logging to BigQuery:", err));
      }

      // 3. Obtener respuesta de Gemini Service (SOLO SI NO HAY INTERVENCION HUMANA)
      if (isUnderCare) {
        setIsTyping(false);
        return; // Salir, el profesional responderá manualmente
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
      const riskLevel = data.risk_level || "BAJO";
      const riskAnalysis = data.risk_analysis || "";

      // 4. Si el riesgo es ALTO, generar alerta para psicólogos (INCLUSO PARA INVITADOS)
      if (riskLevel === "ALTO") {
        await addDoc(collection(db, "emergency_alerts"), {
          userId: user?.uid || "invitado",
          userName: user?.displayName || "Usuario Invitado",
          userEmail: user?.email || "sin-email@lumen.com",
          message: messageText,
          riskAnalysis: riskAnalysis,
          timestamp: serverTimestamp(),
          status: "PENDIENTE",
        });
      }

      // 5. Guardar respuesta del asistente (UI local y Firestore si aplica)
      const newBotMsg: Message = { id: (Date.now()+1).toString(), role: "assistant", content: botResponse, timestamp: new Date() };
      if (!user) setMessages(prev => [...prev, newBotMsg]);

      if (user) {
        await addDoc(collection(db, "users", user.uid, "chat_history"), {
          role: "assistant",
          content: botResponse,
          risk_level: riskLevel,
          timestamp: serverTimestamp(),
        });

        // 6. Registrar respuesta en BigQuery
        fetch('http://localhost:8081/api/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.uid,
            role: "assistant",
            content: botResponse,
            risk_level: riskLevel,
            risk_analysis: riskAnalysis,
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
    <div className="min-h-screen bg-background flex flex-col">
      <FloatingNav />

      {/* Chat Container */}
      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 pt-24 pb-32 md:pb-8">
        {/* Chat Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-semibold">LUMEN</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Siempre disponible
              </p>
            </div>
          </div>
          <Link href="/emergency">
            <Button
              variant="outline"
              size="sm"
              className="rounded-2xl bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20 hover:text-destructive"
            >
              <Phone className="h-4 w-4 mr-2" />
              Emergencia
            </Button>
          </Link>
        </div>

        {isUnderCare && (
          <div className="bg-primary/5 border border-primary/10 p-3 mb-6 text-center animate-in slide-in-from-top duration-500 rounded-2xl">
            <p className="text-xs font-bold text-primary uppercase tracking-widest flex items-center justify-center gap-2">
              <ShieldAlert className="h-3 w-3" />
              Un profesional está supervisando esta conversación
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-6 mb-6">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] md:max-w-[70%]",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-3xl rounded-br-lg"
                      : message.content.startsWith("[PROFESIONAL]")
                        ? "bg-primary/5 border-2 border-primary/20 text-foreground rounded-3xl rounded-bl-lg ring-4 ring-primary/5"
                        : "bg-card border-2 border-border rounded-3xl rounded-bl-lg"
                  )}
                >
                  <div className="px-5 py-4">
                    {message.content.startsWith("[PROFESIONAL]") && (
                      <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-primary uppercase tracking-widest">
                        <UserCircle className="h-3.5 w-3.5" />
                        Psicólogo Profesional
                      </div>
                    )}
                    <p className="text-[15px] leading-relaxed">{message.content.replace("[PROFESIONAL] ", "")}</p>
                  </div>
                  <div
                    className={cn(
                      "px-5 pb-3 text-xs",
                      message.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
                    )}
                    suppressHydrationWarning
                  >
                    {message.timestamp instanceof Date ? message.timestamp.toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    }) : ""}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-card border-2 border-border rounded-3xl rounded-bl-lg px-6 py-4">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2.5 h-2.5 bg-primary/60 rounded-full"
                      animate={{ y: [0, -8, 0] }}
                      transition={{
                        duration: 0.6,
                        repeat: Number.POSITIVE_INFINITY,
                        delay: i * 0.15,
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies */}
        {messages.length <= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-2 mb-4"
          >
            {quickReplies.map((reply) => (
              <Button
                key={reply}
                variant="outline"
                size="sm"
                className="rounded-2xl bg-transparent hover:bg-primary/10 hover:border-primary/30"
                onClick={() => handleSend(reply)}
              >
                {reply}
              </Button>
            ))}
          </motion.div>
        )}

        {/* Input Area */}
        <div className="sticky bottom-20 md:bottom-0 bg-background pt-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe lo que sientes..."
                rows={1}
                className="w-full resize-none rounded-2xl border-2 border-border bg-card px-5 py-4 pr-24 text-[15px] focus:outline-none focus:border-primary/50 transition-colors"
                style={{ minHeight: "56px", maxHeight: "150px" }}
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-1">
                <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 text-muted-foreground">
                  <Smile className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 text-muted-foreground">
                  <Mic className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <Button
              onClick={() => handleSend()}
              size="icon"
              className="rounded-2xl h-14 w-14 shadow-lg shadow-primary/20"
              disabled={!input.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-4">
            LUMEN es apoyo emocional, no reemplaza ayuda profesional
          </p>
        </div>
      </main>
    </div>
  )
}
