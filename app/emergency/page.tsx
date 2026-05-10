"use client";

import { motion } from "framer-motion";
import { Phone, Heart, ShieldAlert, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const helpLines = [
  {
    country: "Internacional (Línea de Vida)",
    number: "988",
    desc: "Disponible 24/7 para apoyo en crisis y prevención del suicidio."
  },
  {
    country: "Colombia",
    number: "106",
    desc: "Línea de ayuda para la salud mental y emergencias emocionales."
  },
  {
    country: "México",
    number: "800 911 2000",
    desc: "Línea de la Vida para apoyo emocional y sustancias."
  },
  {
    country: "España",
    number: "024",
    desc: "Línea de atención a la conducta suicida."
  }
];

export default function EmergencyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full bg-white rounded-[40px] shadow-2xl shadow-destructive/10 overflow-hidden border border-destructive/10"
      >
        <div className="bg-destructive p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <ShieldAlert className="w-64 h-64 -ml-20 -mt-20" />
          </div>
          <ShieldAlert className="h-16 w-16 mx-auto mb-4 relative z-10" />
          <h1 className="text-3xl font-serif font-bold relative z-10">No estás solo, estamos aquí</h1>
          <p className="text-destructive-foreground/90 mt-2 relative z-10">Si sientes que estás en peligro inmediato, por favor usa estos recursos:</p>
        </div>

        <div className="p-8 md:p-12 space-y-8">
          <div className="grid gap-4">
            {helpLines.map((line, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-destructive/20 transition-all group"
              >
                <div>
                  <h3 className="font-bold text-slate-900">{line.country}</h3>
                  <p className="text-sm text-slate-500 max-w-[250px]">{line.desc}</p>
                </div>
                <a href={`tel:${line.number.replace(/\s/g, '')}`}>
                  <Button size="lg" className="bg-destructive hover:bg-destructive/90 rounded-2xl h-14 px-6 shadow-lg shadow-destructive/20">
                    <Phone className="mr-2 h-5 w-5 animate-pulse" />
                    {line.number}
                  </Button>
                </a>
              </motion.div>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col items-center gap-4">
            <p className="text-center text-slate-500 text-sm">
              LUMEN es un espacio de apoyo, pero en situaciones críticas, la ayuda humana directa es irremplazable.
            </p>
            <div className="flex gap-4 w-full">
              <Link href="/chat" className="flex-1">
                <Button variant="outline" className="w-full h-14 rounded-2xl border-slate-200">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al Chat
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button variant="ghost" className="w-full h-14 rounded-2xl">
                  <Home className="mr-2 h-4 w-4" />
                  Ir al Inicio
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
