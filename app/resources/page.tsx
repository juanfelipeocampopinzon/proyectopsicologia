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
} from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"
import { useState } from "react"
import { cn } from "@/lib/utils"

const featuredResource = {
  id: 0,
  type: "video",
  title: "Meditacion guiada para encontrar calma interior",
  description:
    "Una sesion de 10 minutos disenada para ayudarte a conectar contigo mismo y encontrar paz en momentos de estres.",
  duration: "10 min",
  category: "Meditacion",
  image: "/images/resources/featured-meditation.jpg",
}

const resources = [
  {
    id: 1,
    type: "article",
    title: "5 tecnicas de respiracion para calmar la ansiedad",
    description: "Ejercicios simples que puedes hacer en cualquier momento.",
    duration: "5 min",
    category: "Ansiedad",
    icon: Wind,
    color: "from-blue-500/20 to-cyan-500/20",
  },
  {
    id: 2,
    type: "audio",
    title: "Sonidos de la naturaleza para dormir",
    description: "Audio inmersivo con sonidos del bosque.",
    duration: "30 min",
    category: "Sueno",
    icon: Moon,
    color: "from-indigo-500/20 to-purple-500/20",
  },
  {
    id: 3,
    type: "article",
    title: "Como construir una rutina de autocuidado",
    description: "Guia paso a paso para crear habitos saludables.",
    duration: "8 min",
    category: "Autocuidado",
    icon: Heart,
    color: "from-pink-500/20 to-rose-500/20",
  },
  {
    id: 4,
    type: "video",
    title: "Yoga suave para reducir el estres",
    description: "Secuencia que puedes practicar en casa.",
    duration: "20 min",
    category: "Ejercicio",
    icon: Sparkles,
    color: "from-amber-500/20 to-orange-500/20",
  },
  {
    id: 5,
    type: "article",
    title: "Entendiendo las emociones dificiles",
    description: "Estrategias para procesar emociones complejas.",
    duration: "12 min",
    category: "Emociones",
    icon: Heart,
    color: "from-red-500/20 to-pink-500/20",
  },
  {
    id: 6,
    type: "audio",
    title: "Afirmaciones positivas para el dia",
    description: "Comienza tu manana con energia positiva.",
    duration: "5 min",
    category: "Motivacion",
    icon: Sparkles,
    color: "from-green-500/20 to-emerald-500/20",
  },
]

const categories = ["Todos", "Ansiedad", "Meditacion", "Sueno", "Autocuidado", "Emociones"]

const getTypeIcon = (type: string) => {
  switch (type) {
    case "article":
      return BookOpen
    case "video":
      return Video
    case "audio":
      return Headphones
    default:
      return BookOpen
  }
}

export default function ResourcesPage() {
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredResources = resources.filter((resource) => {
    const matchesCategory =
      selectedCategory === "Todos" || resource.category === selectedCategory
    const matchesSearch =
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.category.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-background">
      <FloatingNav />

      <main className="container mx-auto px-4 pt-24 pb-32 md:pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-4 text-balance">
            Recursos para tu bienestar
          </h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Articulos, meditaciones y herramientas para apoyar tu camino hacia el bienestar emocional
          </p>
        </motion.div>

        {/* Featured Resource */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <div className="rounded-3xl border-2 border-border bg-gradient-to-br from-primary/10 via-card to-secondary/10 overflow-hidden group cursor-pointer hover:border-primary/30 transition-all">
            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-2/5 h-64 lg:h-auto relative bg-gradient-to-br from-primary/30 to-secondary/30">
                {/* TODO: Agregar imagen destacada /images/resources/featured-meditation.jpg */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-primary/20 backdrop-blur flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="h-8 w-8 text-primary ml-1" />
                  </div>
                </div>
                <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground border-0">
                  Destacado
                </Badge>
              </div>
              <div className="flex-1 p-8 lg:p-10 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="secondary" className="rounded-lg">
                    <Video className="h-3 w-3 mr-1" />
                    Video
                  </Badge>
                  <Badge variant="outline" className="rounded-lg">
                    <Clock className="h-3 w-3 mr-1" />
                    {featuredResource.duration}
                  </Badge>
                </div>
                <h2 className="text-2xl md:text-3xl font-serif font-semibold mb-3 text-balance">
                  {featuredResource.title}
                </h2>
                <p className="text-muted-foreground mb-6 text-pretty">{featuredResource.description}</p>
                <Button className="rounded-2xl w-fit">
                  Ver ahora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 space-y-4"
        >
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar recursos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-border bg-card text-[15px] focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                className={cn(
                  "rounded-2xl",
                  selectedCategory !== category && "bg-transparent"
                )}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Resources Grid - Unique Bento Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((resource, index) => {
            const TypeIcon = getTypeIcon(resource.type)
            const ResourceIcon = resource.icon
            return (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                className={cn(
                  "group cursor-pointer",
                  index === 0 && "md:col-span-2 lg:col-span-1"
                )}
              >
                <div className="h-full rounded-3xl border-2 border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                  {/* Gradient Header */}
                  <div className={cn("h-32 relative bg-gradient-to-br", resource.color)}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ResourceIcon className="h-12 w-12 text-foreground/20" />
                    </div>
                    <div className="absolute top-4 left-4">
                      <Badge variant="secondary" className="bg-background/80 backdrop-blur rounded-lg">
                        <TypeIcon className="h-3 w-3 mr-1" />
                        {resource.type === "article"
                          ? "Articulo"
                          : resource.type === "video"
                            ? "Video"
                            : "Audio"}
                      </Badge>
                    </div>
                    <div className="absolute top-4 right-4">
                      <Badge variant="secondary" className="bg-background/80 backdrop-blur rounded-lg">
                        <Clock className="h-3 w-3 mr-1" />
                        {resource.duration}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <Badge variant="outline" className="mb-3 rounded-lg text-xs">
                      {resource.category}
                    </Badge>
                    <h3 className="text-lg font-semibold mb-2 leading-tight text-balance group-hover:text-primary transition-colors">
                      {resource.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {resource.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {filteredResources.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No se encontraron recursos</p>
            <Button
              variant="outline"
              className="mt-4 rounded-2xl bg-transparent"
              onClick={() => {
                setSelectedCategory("Todos")
                setSearchQuery("")
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        )}

        {/* Load More */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 text-center"
        >
          <Button variant="outline" size="lg" className="rounded-2xl bg-transparent">
            Cargar mas recursos
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </main>
    </div>
  )
}
