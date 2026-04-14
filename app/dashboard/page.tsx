"use client"

import { FloatingNav } from "@/components/floating-nav"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  MessageCircle,
  Calendar,
  Heart,
  TrendingUp,
  BookOpen,
  Sparkles,
  ArrowRight,
  Settings,
  Bell,
  User,
  ChevronRight,
  Flame,
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

const weekDays = ["L", "M", "X", "J", "V", "S", "D"]
const activityData = [3, 5, 2, 7, 4, 6, 8] // Simulated activity levels

const recentConversations = [
  { date: "Hoy, 10:30 AM", preview: "Hablamos sobre tecnicas de respiracion...", mood: "calm" },
  { date: "Ayer, 8:15 PM", preview: "Exploramos tus sentimientos sobre el trabajo...", mood: "reflective" },
  { date: "Hace 3 dias", preview: "Discutimos estrategias para manejar la ansiedad...", mood: "anxious" },
]

const recommendations = [
  {
    title: "Meditacion guiada",
    description: "5 minutos para calmar tu mente",
    icon: "yoga",
    color: "from-primary/20 to-primary/10",
  },
  {
    title: "Ejercicio de respiracion",
    description: "Tecnica 4-7-8 para reducir estres",
    icon: "breathe",
    color: "from-secondary/20 to-secondary/10",
  },
  {
    title: "Articulo recomendado",
    description: "Como cultivar la autocompasion",
    icon: "read",
    color: "from-accent/20 to-accent/10",
  },
]

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <FloatingNav />

      <main className="container mx-auto px-4 pt-24 pb-32 md:pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between mb-10"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-semibold mb-2">
              Bienvenido de vuelta
            </h1>
            <p className="text-muted-foreground">Asi va tu camino de bienestar</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <Settings className="h-5 w-5" />
            </Button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
          </div>
        </motion.div>

        {/* Bento Grid Dashboard */}
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          {/* Emotional Status Card - Large */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="col-span-12 lg:col-span-8 row-span-1"
          >
            <div className="h-full rounded-3xl bg-gradient-to-br from-primary/10 via-card to-secondary/10 border-2 border-border p-6 md:p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Estado emocional</h2>
                    <p className="text-sm text-muted-foreground">Ultima semana</p>
                  </div>
                </div>
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +15% mejora
                </Badge>
              </div>

              <div className="flex items-end justify-between gap-2 h-32 mb-6">
                {weekDays.map((day, i) => (
                  <div key={day} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full rounded-xl bg-primary/20 transition-all hover:bg-primary/40"
                      style={{ height: `${activityData[i] * 12}%` }}
                    />
                    <span className="text-xs text-muted-foreground">{day}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-6 pt-4 border-t border-border">
                <div>
                  <p className="text-3xl font-serif font-bold">7</p>
                  <p className="text-xs text-muted-foreground">dias de racha</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div>
                  <p className="text-3xl font-serif font-bold">23</p>
                  <p className="text-xs text-muted-foreground">conversaciones</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="flex items-center gap-2">
                  <Flame className="h-6 w-6 text-orange-500" />
                  <div>
                    <p className="font-semibold">Racha activa</p>
                    <p className="text-xs text-muted-foreground">Sigue asi!</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="col-span-12 sm:col-span-6 lg:col-span-4 row-span-1"
          >
            <div className="h-full rounded-3xl bg-primary p-6 md:p-8 text-primary-foreground flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-primary-foreground/20 flex items-center justify-center mb-4">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">¿Como te sientes hoy?</h3>
                <p className="text-primary-foreground/80 text-sm">
                  Habla con LUMEN cuando lo necesites
                </p>
              </div>
              <Link href="/chat" className="mt-6">
                <Button variant="secondary" className="w-full rounded-2xl">
                  Iniciar chat
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Recent Conversations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="col-span-12 sm:col-span-6 lg:col-span-6 row-span-1"
          >
            <div className="h-full rounded-3xl bg-card border-2 border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-secondary" />
                  Conversaciones recientes
                </h3>
                <Button variant="ghost" size="sm" className="rounded-xl text-muted-foreground">
                  Ver todas
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <div className="space-y-3">
                {recentConversations.map((conv, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{conv.date}</p>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{conv.preview}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="col-span-12 lg:col-span-6 row-span-1"
          >
            <div className="h-full rounded-3xl bg-card border-2 border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Recomendaciones para ti
                </h3>
              </div>
              <div className="space-y-3">
                {recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-2xl bg-gradient-to-r ${rec.color} cursor-pointer hover:scale-[1.02] transition-transform`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium mb-1">{rec.title}</h4>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="rounded-xl">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Upcoming Appointment */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="col-span-12 lg:col-span-6 row-span-1"
          >
            <div className="h-full rounded-3xl bg-secondary/20 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-secondary/30 flex items-center justify-center">
                    <Calendar className="h-7 w-7 text-secondary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Proxima cita</h3>
                    <p className="text-2xl font-serif font-bold">Mierc, 15 Feb</p>
                    <p className="text-sm text-muted-foreground">2:00 PM - Dra. Maria Gonzalez</p>
                  </div>
                </div>
                <Button variant="outline" className="rounded-2xl bg-transparent">
                  <Calendar className="h-4 w-4 mr-2" />
                  Gestionar
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Resources Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="col-span-12 lg:col-span-6 row-span-1"
          >
            <Link href="/resources" className="block h-full">
              <div className="h-full rounded-3xl bg-gradient-to-r from-card to-accent/10 border-2 border-border p-6 flex items-center justify-between hover:border-accent/30 transition-colors group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center">
                    <BookOpen className="h-7 w-7 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Explora recursos</h3>
                    <p className="text-sm text-muted-foreground">
                      Articulos, meditaciones y mas
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-2 transition-transform" />
              </div>
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
