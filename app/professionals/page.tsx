"use client"

import { FloatingNav } from "@/components/floating-nav"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Star, Calendar, Video, MessageSquare, ArrowRight, Filter } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { useState } from "react"
import { cn } from "@/lib/utils"

const professionals = [
  {
    id: 1,
    name: "Dra. Maria Gonzalez",
    specialty: "Ansiedad y Estres",
    rating: 4.9,
    reviews: 127,
    languages: ["Espanol", "Ingles"],
    experience: "12 anos",
    available: true,
    nextSlot: "Hoy, 4:00 PM",
    price: "$45/sesion",
    image: "/images/professionals/maria-gonzalez.jpg",
  },
  {
    id: 2,
    name: "Dr. Carlos Ramirez",
    specialty: "Depresion y Duelo",
    rating: 4.8,
    reviews: 98,
    languages: ["Espanol"],
    experience: "8 anos",
    available: true,
    nextSlot: "Manana, 10:00 AM",
    price: "$40/sesion",
    image: "/images/professionals/carlos-ramirez.jpg",
  },
  {
    id: 3,
    name: "Lic. Ana Torres",
    specialty: "Autoestima",
    rating: 5.0,
    reviews: 143,
    languages: ["Espanol", "Portugues"],
    experience: "15 anos",
    available: false,
    nextSlot: "Vie, 2:00 PM",
    price: "$50/sesion",
    image: "/images/professionals/ana-torres.jpg",
  },
  {
    id: 4,
    name: "Dr. Luis Mendoza",
    specialty: "Terapia de Pareja",
    rating: 4.7,
    reviews: 85,
    languages: ["Espanol"],
    experience: "10 anos",
    available: true,
    nextSlot: "Hoy, 6:00 PM",
    price: "$55/sesion",
    image: "/images/professionals/luis-mendoza.jpg",
  },
  {
    id: 5,
    name: "Dra. Patricia Vega",
    specialty: "Trauma y PTSD",
    rating: 4.9,
    reviews: 112,
    languages: ["Espanol", "Ingles"],
    experience: "14 anos",
    available: true,
    nextSlot: "Manana, 3:00 PM",
    price: "$48/sesion",
    image: "/images/professionals/patricia-vega.jpg",
  },
  {
    id: 6,
    name: "Lic. Roberto Silva",
    specialty: "Adicciones",
    rating: 4.8,
    reviews: 76,
    languages: ["Espanol"],
    experience: "9 anos",
    available: false,
    nextSlot: "Lun, 11:00 AM",
    price: "$42/sesion",
    image: "/images/professionals/roberto-silva.jpg",
  },
]

const specialties = ["Todos", "Ansiedad", "Depresion", "Estres", "Autoestima", "Trauma", "Pareja"]

export default function ProfessionalsPage() {
  const [selectedSpecialty, setSelectedSpecialty] = useState("Todos")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredProfessionals = professionals.filter((prof) => {
    const matchesSpecialty =
      selectedSpecialty === "Todos" ||
      prof.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase())
    const matchesSearch =
      prof.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prof.specialty.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSpecialty && matchesSearch
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
            Encuentra tu profesional ideal
          </h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Conecta con psicologos y terapeutas certificados que entienden lo que estas pasando
          </p>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nombre o especialidad..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-border bg-card text-[15px] focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <Button variant="outline" size="lg" className="rounded-2xl h-14 px-6 bg-transparent">
              <Filter className="h-5 w-5 mr-2" />
              Filtros
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {specialties.map((specialty) => (
              <Button
                key={specialty}
                variant={selectedSpecialty === specialty ? "default" : "outline"}
                size="sm"
                className={cn(
                  "rounded-2xl",
                  selectedSpecialty !== specialty && "bg-transparent"
                )}
                onClick={() => setSelectedSpecialty(specialty)}
              >
                {specialty}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Professionals Grid - Unique Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProfessionals.map((prof, index) => (
            <motion.div
              key={prof.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="group"
            >
              <div className="rounded-3xl border-2 border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-xl transition-all duration-300">
                <div className="flex flex-col sm:flex-row">
                  {/* Image/Avatar Section */}
                  <div className="sm:w-48 h-48 sm:h-auto relative bg-gradient-to-br from-primary/20 to-secondary/20 flex-shrink-0">
                    {/* TODO: Agregar foto real del profesional */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/40 to-secondary/40 flex items-center justify-center text-3xl font-serif font-semibold text-foreground/70">
                        {prof.name.split(" ").slice(-1)[0].charAt(0)}
                      </div>
                    </div>
                    {prof.available && (
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-green-500/90 text-white border-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-pulse" />
                          Disponible
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{prof.name}</h3>
                        <p className="text-primary font-medium text-sm">{prof.specialty}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-4 w-4 fill-accent text-accent" />
                          <span className="font-semibold">{prof.rating}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{prof.reviews} resenas</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {prof.languages.map((lang) => (
                        <Badge key={lang} variant="secondary" className="text-xs rounded-lg">
                          {lang}
                        </Badge>
                      ))}
                      <Badge variant="outline" className="text-xs rounded-lg">
                        {prof.experience}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Proxima cita</p>
                        <p className="text-sm font-medium">{prof.nextSlot}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-xl h-10 w-10 bg-transparent"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-xl h-10 w-10 bg-transparent"
                        >
                          <Video className="h-4 w-4" />
                        </Button>
                        <Button className="rounded-xl h-10 px-4">
                          <Calendar className="h-4 w-4 mr-2" />
                          Agendar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredProfessionals.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No se encontraron profesionales</p>
            <Button
              variant="outline"
              className="mt-4 rounded-2xl bg-transparent"
              onClick={() => {
                setSelectedSpecialty("Todos")
                setSearchQuery("")
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <div className="rounded-3xl bg-gradient-to-r from-secondary/20 via-card to-primary/20 border-2 border-border p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-serif font-semibold mb-2">
                ¿No sabes por donde empezar?
              </h3>
              <p className="text-muted-foreground">
                Habla con LUMEN y te ayudamos a encontrar el profesional ideal para ti
              </p>
            </div>
            <Link href="/chat">
              <Button size="lg" className="rounded-2xl">
                Hablar con LUMEN
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
