"use client"

import { FloatingNav } from "@/components/floating-nav"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Phone, MessageCircle, Globe, Heart, AlertCircle, ArrowRight, Shield } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useState } from "react"
import { cn } from "@/lib/utils"

const emergencyLines = [
  {
    country: "Mexico",
    flag: "MX",
    lines: [
      { name: "Linea de la Vida", phone: "800-911-2000", available: "24/7" },
      { name: "SAPTEL", phone: "55-5259-8121", available: "24/7" },
    ],
  },
  {
    country: "Espana",
    flag: "ES",
    lines: [
      { name: "Telefono de la Esperanza", phone: "717-003-717", available: "24/7" },
      { name: "Salud Mental Espana", phone: "911-385-385", available: "24/7" },
    ],
  },
  {
    country: "Argentina",
    flag: "AR",
    lines: [
      { name: "Centro de Asistencia al Suicida", phone: "135", available: "24/7" },
      { name: "Linea 102", phone: "102", available: "24/7" },
    ],
  },
  {
    country: "Colombia",
    flag: "CO",
    lines: [
      { name: "Linea 106", phone: "106", available: "24/7" },
      { name: "Linea Amiga", phone: "01-800-423-4444", available: "24/7" },
    ],
  },
]

const safetySteps = [
  {
    step: 1,
    title: "Respira profundo",
    description: "Toma tres respiraciones lentas y profundas. Esto puede ayudarte a calmarte en este momento.",
  },
  {
    step: 2,
    title: "Llama a alguien",
    description:
      "Contacta una linea de crisis, un amigo de confianza o un familiar. No tienes que pasar por esto solo.",
  },
  {
    step: 3,
    title: "Ve a un lugar seguro",
    description: "Si estas en peligro inmediato, busca ayuda de emergencia o ve al hospital mas cercano.",
  },
]

export default function EmergencyPage() {
  const [selectedCountry, setSelectedCountry] = useState("Mexico")

  const currentCountry = emergencyLines.find((c) => c.country === selectedCountry)

  return (
    <div className="min-h-screen bg-background">
      <FloatingNav />

      <main className="container mx-auto px-4 pt-24 pb-32 md:pb-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto text-center mb-12"
        >
          <div className="w-20 h-20 mx-auto rounded-3xl bg-destructive/10 flex items-center justify-center mb-6">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-4 text-balance">
            Si estas en crisis, no estas solo
          </h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Tu vida importa. Hay personas esperando para ayudarte ahora mismo.
          </p>
        </motion.div>

        {/* Immediate Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto mb-12"
        >
          <div className="rounded-3xl bg-destructive/10 border-2 border-destructive/20 p-6 md:p-8">
            <div className="w-14 h-14 rounded-2xl bg-destructive/20 flex items-center justify-center mb-4">
              <Phone className="h-7 w-7 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Llamar a linea de ayuda</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Habla con un profesional capacitado que puede ayudarte ahora.
            </p>
            <Button
              variant="destructive"
              className="w-full rounded-2xl h-12"
              onClick={() =>
                document.getElementById("emergency-lines")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <Phone className="h-5 w-5 mr-2" />
              Ver numeros de emergencia
            </Button>
          </div>

          <div className="rounded-3xl bg-primary/10 border-2 border-primary/20 p-6 md:p-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
              <MessageCircle className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Hablar con LUMEN</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Apoyo emocional inmediato mientras buscas ayuda profesional.
            </p>
            <Link href="/chat">
              <Button className="w-full rounded-2xl h-12">
                <MessageCircle className="h-5 w-5 mr-2" />
                Iniciar conversacion
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Safety Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto mb-12"
        >
          <div className="rounded-3xl bg-card border-2 border-border p-6 md:p-10">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-serif font-semibold mb-2">Tu vida importa</h2>
              <p className="text-muted-foreground text-pretty">
                Estos son momentos dificiles, pero hay esperanza. Sigue estos pasos:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {safetySteps.map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="p-6 rounded-2xl bg-muted/50"
                >
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold mb-4">
                    {item.step}
                  </div>
                  <h4 className="font-semibold mb-2">{item.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Emergency Lines by Country */}
        <motion.div
          id="emergency-lines"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-2xl font-serif font-semibold mb-6 text-center">
            Lineas de ayuda por pais
          </h2>

          {/* Country Selector */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {emergencyLines.map((country) => (
              <Button
                key={country.country}
                variant={selectedCountry === country.country ? "default" : "outline"}
                className={cn(
                  "rounded-2xl",
                  selectedCountry !== country.country && "bg-transparent"
                )}
                onClick={() => setSelectedCountry(country.country)}
              >
                <Globe className="h-4 w-4 mr-2" />
                {country.country}
              </Button>
            ))}
          </div>

          {/* Selected Country Lines */}
          {currentCountry && (
            <motion.div
              key={selectedCountry}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl bg-card border-2 border-border overflow-hidden"
            >
              <div className="p-6 bg-muted/30 border-b border-border">
                <div className="flex items-center gap-3">
                  <Globe className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-semibold">{currentCountry.country}</h3>
                </div>
              </div>
              <div className="divide-y divide-border">
                {currentCountry.lines.map((line, index) => (
                  <div key={index} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-medium mb-1">{line.name}</p>
                      <p className="text-3xl font-serif font-bold text-destructive">{line.phone}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="rounded-lg">
                        <Shield className="h-3 w-3 mr-1" />
                        {line.available}
                      </Badge>
                      <Button className="rounded-2xl">
                        <Phone className="h-4 w-4 mr-2" />
                        Llamar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-4xl mx-auto mt-12"
        >
          <div className="rounded-3xl bg-gradient-to-r from-primary/10 via-card to-secondary/10 border-2 border-border p-8 text-center">
            <h3 className="text-xl font-serif font-semibold mb-2">Recuerda</h3>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              LUMEN es un apoyo emocional complementario. En caso de emergencia, siempre contacta a los
              servicios profesionales de crisis.
            </p>
            <Link href="/professionals">
              <Button variant="outline" className="rounded-2xl bg-transparent">
                Conectar con profesional
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
