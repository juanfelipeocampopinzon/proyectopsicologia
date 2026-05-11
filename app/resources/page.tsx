"use client"

import { FloatingNav } from "@/components/floating-nav"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  BookOpen,
  Video,
  Headphones,
  Clock,
  Play,
  ArrowRight,
  Sparkles,
  Wind,
  Moon,
  Heart,
  X,
  ExternalLink
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

const featuredResource = {
  id: "f1",
  type: "video",
  title: "Meditacion guiada para encontrar calma interior",
  description: "Una sesion de 10 minutos disenada para ayudarte a conectar contigo mismo y encontrar paz en momentos de estres.",
  duration: "10 min",
  category: "Meditacion",
}

const articleContents: Record<string, { title: string, content: React.ReactNode }> = {
  "s1": {
    title: "5 Técnicas de Respiración para la Ansiedad",
    content: (
      <div className="space-y-6 text-slate-700">
        <p>La respiración consciente es la herramienta más rápida para calmar el sistema nervioso:</p>
        <div className="space-y-6">
          <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
            <h4 className="font-bold text-blue-900 mb-2">1. Respiración de Caja (4-4-4-4)</h4>
            <p className="text-sm">Inhala por 4 segundos, mantén 4, exhala 4 y espera 4. Repite 4 veces.</p>
          </div>
          <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
            <h4 className="font-bold text-indigo-900 mb-2">2. Respiración 4-7-8</h4>
            <p className="text-sm">Inhala (4s), mantén (7s) y exhala por la boca (8s). Es el "tranquilizante natural".</p>
          </div>
          <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
            <h4 className="font-bold text-emerald-900 mb-2">3. Respiración Abdominal</h4>
            <p className="text-sm">Lleva el aire al estómago, no al pecho. Pon una mano en tu ombligo y siente cómo sube.</p>
          </div>
        </div>
      </div>
    )
  },
  "s3": {
    title: "Rutina de Autocuidado Diario",
    content: (
      <div className="space-y-6 text-slate-700">
        <p>No necesitas mucho tiempo para cuidarte. Aquí tienes una rutina de 15 minutos:</p>
        <ul className="space-y-4">
          <li className="flex gap-4">
            <span className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 font-bold">5'</span>
            <p><strong>Movimiento consciente:</strong> Estira tu cuello y espalda. Libera la tensión acumulada.</p>
          </li>
          <li className="flex gap-4">
            <span className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 font-bold">5'</span>
            <p><strong>Escritura (Journaling):</strong> Escribe tres cosas por las que estés agradecido hoy.</p>
          </li>
          <li className="flex gap-4">
            <span className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 font-bold">5'</span>
            <p><strong>Silencio:</strong> Simplemente siéntate y observa tus pensamientos sin juzgarlos.</p>
          </li>
        </ul>
      </div>
    )
  },
  "s5": {
    title: "Entendiendo las Emociones Dificiles",
    content: (
      <div className="space-y-6 text-slate-700">
        <p>Cuando sientas una emoción abrumadora, usa la técnica <strong>RAIN</strong>:</p>
        <div className="grid gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border-l-4 border-primary">
            <p><strong>R</strong>econoce: "Siento ansiedad en mi pecho".</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border-l-4 border-primary">
            <p><strong>A</strong>cepta: No intentes que se vaya, déjala estar ahí.</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border-l-4 border-primary">
            <p><strong>I</strong>nvestiga: "¿Qué necesita esta emoción ahora mismo?".</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border-l-4 border-primary">
            <p><strong>N</strong>utre/No identifiques: Tú no eres la emoción, tú eres quien la observa.</p>
          </div>
        </div>
      </div>
    )
  }
};

const categories = ["Todos", "Ansiedad", "Meditacion", "Sueno", "Autocuidado", "Emociones"]

import { collection, query, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

const staticResources = [
  {
    id: "s1",
    type: "article",
    title: "5 tecnicas de respiracion para calmar la ansiedad",
    description: "Ejercicios simples que puedes hacer en cualquier momento.",
    duration: "5 min",
    category: "Ansiedad",
    icon: Wind,
    color: "from-blue-500/20 to-cyan-500/20",
  },
  {
    id: "s2",
    type: "audio",
    title: "Sonidos de la naturaleza para dormir",
    description: "Audio inmersivo con sonidos del bosque.",
    duration: "30 min",
    category: "Sueno",
    icon: Moon,
    color: "from-indigo-500/20 to-purple-500/20",
  },
  {
    id: "s3",
    type: "article",
    title: "Como construir una rutina de autocuidado",
    description: "Guia paso a paso para crear habitos saludables.",
    duration: "8 min",
    category: "Autocuidado",
    icon: Heart,
    color: "from-pink-500/20 to-rose-500/20",
  },
  {
    id: "s4",
    type: "video",
    title: "Yoga suave para reducir el estres",
    description: "Secuencia que puedes practicar en casa.",
    duration: "20 min",
    category: "Ejercicio",
    icon: Sparkles,
    color: "from-amber-500/20 to-orange-500/20",
  },
  {
    id: "s5",
    type: "article",
    title: "Entendiendo las emociones dificiles",
    description: "Estrategias para procesar emociones complejas.",
    duration: "12 min",
    category: "Emociones",
    icon: Heart,
    color: "from-red-500/20 to-pink-500/20",
  },
  {
    id: "s6",
    type: "audio",
    title: "Afirmaciones positivas para el dia",
    description: "Comienza tu manana con energia positiva.",
    duration: "5 min",
    category: "Motivacion",
    icon: Sparkles,
    color: "from-green-500/20 to-emerald-500/20",
  },
]

export default function ResourcesPage() {
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedArticle, setSelectedArticle] = useState<{id: string, title: string, content?: any} | null>(null)
  const [dynamicResources, setDynamicResources] = useState<any[]>([])

  useEffect(() => {
    const q = query(collection(db, "resources"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        icon: BookOpen, // Icono por defecto para artículos nuevos
      }));
      setDynamicResources(docs);
    });
    return () => unsubscribe();
  }, []);

  const allResources = [...dynamicResources, ...staticResources];

  const filteredResources = allResources.filter((resource) => {
    const matchesCategory = selectedCategory === "Todos" || resource.category === selectedCategory
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-background">
      <FloatingNav />

      <main className="container mx-auto px-4 pt-24 pb-32 md:pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-4 text-balance">Recursos para tu bienestar</h1>
          <p className="text-lg text-muted-foreground">Herramientas interactivas y contenido profesional para tu calma.</p>
        </motion.div>

        {/* RESPIRADOR ZEN */}
        <motion.section initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-16 bg-white rounded-[40px] p-8 md:p-12 border-2 border-primary/10 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
          <Badge className="mb-6 bg-primary/10 text-primary border-0 font-bold uppercase tracking-widest text-[10px]">Alivio Inmediato</Badge>
          <h2 className="text-2xl md:text-3xl font-serif font-bold mb-8">Respirador Zen</h2>
          <div className="relative w-64 h-64 flex items-center justify-center">
            <motion.div animate={{ scale: [1, 1.5, 1.5, 1] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute w-32 h-32 bg-primary/20 rounded-full blur-xl" />
            <motion.div animate={{ scale: [1, 1.4, 1.4, 1] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-white z-10 shadow-xl shadow-primary/30">
              <Wind className="h-8 w-8" />
            </motion.div>
          </div>
          <div className="mt-8 flex gap-4 text-xs font-medium text-slate-400">
            <span>4s Inhala</span> • <span>2s Mantén</span> • <span>4s Exhala</span>
          </div>
        </motion.section>

        {/* BUSCADOR */}
        <div className="mb-8 space-y-6">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input type="text" placeholder="Buscar recursos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-border bg-card focus:outline-none focus:border-primary/50 transition-all" />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Button key={c} variant={selectedCategory === c ? "default" : "outline"} size="sm" className="rounded-full" onClick={() => setSelectedCategory(c)}>{c}</Button>
            ))}
          </div>
        </div>

        {/* GRID DE RECURSOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <motion.div
              key={resource.id}
              layout
              onClick={() => {
                if (resource.externalUrl) {
                  window.open(resource.externalUrl, '_blank');
                } else if (resource.type === 'article') {
                  setSelectedArticle({
                    id: resource.id, 
                    title: resource.title,
                    content: resource.content
                  });
                }
              }}
              className="group cursor-pointer bg-card rounded-[32px] border-2 border-border overflow-hidden hover:border-primary/30 transition-all hover:shadow-xl"
            >
              <div className={cn("h-32 bg-gradient-to-br flex items-center justify-center relative", resource.color)}>
                {resource.externalUrl ? (
                  <ExternalLink className="h-10 w-10 text-foreground/20" />
                ) : (
                  <resource.icon className="h-10 w-10 text-foreground/20" />
                )}
                <Badge className="absolute top-4 left-4 bg-white/80 text-foreground border-0 backdrop-blur-sm">
                  {resource.externalUrl ? 'Sitio Oficial' : resource.type === 'article' ? 'Artículo' : resource.type === 'audio' ? 'Audio' : 'Video'}
                </Badge>
              </div>
              <div className="p-6">
                <Badge variant="outline" className="mb-2 text-[10px] uppercase tracking-widest">{resource.category}</Badge>
                <h3 className="font-bold text-lg mb-2 leading-tight group-hover:text-primary transition-colors">{resource.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{resource.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* MODAL DE LECTURA */}
        <AnimatePresence>
          {selectedArticle && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedArticle(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
              <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white w-full max-w-2xl max-h-[85vh] rounded-[40px] shadow-2xl z-10 overflow-hidden flex flex-col">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
                  <h2 className="font-serif font-bold text-2xl text-slate-900">{selectedArticle.title}</h2>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedArticle(null)} className="rounded-full"><X className="h-6 w-6" /></Button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 md:p-12">
                  {articleContents[selectedArticle.id]?.content || (
                    <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                      {selectedArticle.content || "Contenido en desarrollo..."}
                    </div>
                  )}
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                  <Button onClick={() => setSelectedArticle(null)} className="rounded-2xl px-10 h-12 shadow-lg shadow-primary/20">Terminar lectura</Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
