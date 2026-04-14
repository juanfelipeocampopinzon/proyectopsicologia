"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FloatingNav } from "@/components/floating-nav"
import {
  MessageCircle,
  Users,
  BookOpen,
  Sparkles,
  ArrowRight,
  Play,
  Heart,
  Shield,
  Clock,
  Star,
} from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <FloatingNav />

      {/* Bento Grid Hero */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-12 gap-4 md:gap-6 auto-rows-[minmax(120px,auto)]">
          {/* Main Hero Card - Large */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="col-span-12 lg:col-span-8 row-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 p-8 md:p-12 flex flex-col justify-between min-h-[400px]"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 space-y-6 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                Tu espacio seguro
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-semibold leading-tight text-balance">
                Encuentra calma en cada momento
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl text-pretty">
                LUMEN te acompana con apoyo emocional inmediato, profesionales certificados y recursos para tu
                bienestar.
              </p>
            </div>

            <div className="relative z-10 flex flex-wrap gap-4 mt-8">
              <Link href="/chat">
                <Button size="lg" className="rounded-2xl text-base px-8 h-14 shadow-lg shadow-primary/20">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Comenzar a hablar
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="rounded-2xl text-base px-8 h-14 bg-background/50 backdrop-blur"
              >
                <Play className="mr-2 h-5 w-5" />
                Ver como funciona
              </Button>
            </div>
          </motion.div>

          {/* Quick Action Card - Chat */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="col-span-12 sm:col-span-6 lg:col-span-4 row-span-1 group"
          >
            <Link href="/chat" className="block h-full">
              <div className="h-full rounded-3xl bg-primary p-6 md:p-8 text-primary-foreground flex flex-col justify-between transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/20 cursor-pointer">
                <div className="w-12 h-12 rounded-2xl bg-primary-foreground/20 flex items-center justify-center mb-4">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Chat emocional</h3>
                  <p className="text-primary-foreground/80 text-sm">Habla con LUMEN 24/7</p>
                </div>
                <ArrowRight className="h-5 w-5 mt-4 group-hover:translate-x-2 transition-transform" />
              </div>
            </Link>
          </motion.div>

          {/* Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="col-span-12 sm:col-span-6 lg:col-span-4 row-span-1"
          >
            <div className="h-full rounded-3xl bg-card border-2 border-border p-6 md:p-8 flex flex-col justify-between">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 border-2 border-background flex items-center justify-center text-xs font-medium"
                    >
                      {/* TODO: Agregar avatares aqui /images/avatars/user-{i}.jpg */}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">+12,000 personas apoyadas</div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-serif font-bold">98%</span>
                  <span className="text-muted-foreground text-sm">satisfaccion</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Professional Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="col-span-12 sm:col-span-6 lg:col-span-4 row-span-2 group"
          >
            <Link href="/professionals" className="block h-full">
              <div className="h-full rounded-3xl bg-secondary/20 p-6 md:p-8 flex flex-col transition-all hover:bg-secondary/30 cursor-pointer">
                <div className="flex-1 flex flex-col">
                  <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <h3 className="text-2xl font-serif font-semibold mb-3 text-balance">
                    Profesionales certificados
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Conecta con psicologos y terapeutas especializados que entienden lo que estas pasando.
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-secondary/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      <span className="text-sm font-medium">4.9 promedio</span>
                    </div>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="col-span-12 sm:col-span-6 lg:col-span-4 row-span-1"
          >
            <div className="h-full rounded-3xl bg-accent/20 p-6 md:p-8 flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center flex-shrink-0">
                <Shield className="h-8 w-8 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">100% Confidencial</h3>
                <p className="text-sm text-muted-foreground">Tus conversaciones estan protegidas</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="col-span-12 sm:col-span-6 lg:col-span-4 row-span-1"
          >
            <div className="h-full rounded-3xl bg-card border-2 border-border p-6 md:p-8 flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Disponible 24/7</h3>
                <p className="text-sm text-muted-foreground">Cuando lo necesites</p>
              </div>
            </div>
          </motion.div>

          {/* Resources Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="col-span-12 lg:col-span-8 row-span-1 group"
          >
            <Link href="/resources" className="block h-full">
              <div className="h-full rounded-3xl bg-gradient-to-r from-card via-card to-secondary/10 border-2 border-border p-6 md:p-8 flex items-center justify-between transition-all hover:border-secondary/50 cursor-pointer">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-8 w-8 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1">Recursos para tu bienestar</h3>
                    <p className="text-muted-foreground text-sm">
                      Articulos, meditaciones, ejercicios de respiracion y mas
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:translate-x-2 group-hover:text-foreground transition-all" />
              </div>
            </Link>
          </motion.div>

          {/* Testimonial Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="col-span-12 lg:col-span-6 row-span-1"
          >
            <div className="h-full rounded-3xl bg-card border-2 border-border p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center flex-shrink-0">
                  {/* TODO: Agregar foto /images/testimonials/user-1.jpg */}
                  <span className="text-lg font-medium">M</span>
                </div>
                <div>
                  <p className="text-foreground leading-relaxed italic mb-3 text-pretty">
                    "LUMEN me ayudo a encontrar paz en momentos muy dificiles. Es como tener un amigo que siempre
                    esta ahi."
                  </p>
                  <p className="text-sm text-muted-foreground">Maria G. - Usuario desde 2025</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CTA Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="col-span-12 lg:col-span-6 row-span-1"
          >
            <div className="h-full rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-6 md:p-8 text-primary-foreground flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Heart className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Comienza hoy</h3>
                  <p className="text-sm text-primary-foreground/80">Tu bienestar es nuestra prioridad</p>
                </div>
              </div>
              <Link href="/chat">
                <Button variant="secondary" className="rounded-2xl">
                  Empezar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">LUMEN</span>
              <span>© 2026</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacidad
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terminos
              </Link>
              <Link href="/emergency" className="text-destructive hover:text-destructive/80 transition-colors">
                Emergencia
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
