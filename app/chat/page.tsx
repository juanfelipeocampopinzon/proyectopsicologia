"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import { FloatingNav } from "@/components/floating-nav"
import { Button } from "@/components/ui/button"
import { Send, Sparkles, Phone, Mic, Smile } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hola, soy LUMEN. Estoy aqui para escucharte sin juzgar. ¿Como te sientes hoy?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (text?: string) => {
    const messageText = text || input
    if (!messageText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    setTimeout(() => {
      const responses = [
        "Entiendo como te sientes. Es completamente valido. ¿Quieres contarme mas?",
        "Gracias por compartir esto conmigo. Tus sentimientos importan. ¿Que te gustaria explorar?",
        "Estoy aqui contigo. Expresar lo que sentimos es el primer paso. ¿Como puedo ayudarte?",
        "Te escucho. Recuerda que esta bien no estar bien. ¿Hay algo especifico que te preocupa?",
      ]

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setIsTyping(false)
    }, 1500)
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
                      : "bg-card border-2 border-border rounded-3xl rounded-bl-lg"
                  )}
                >
                  <div className="px-5 py-4">
                    <p className="text-[15px] leading-relaxed">{message.content}</p>
                  </div>
                  <div
                    className={cn(
                      "px-5 pb-3 text-xs",
                      message.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
                    )}
                  >
                    {message.timestamp.toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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
