"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkles, MessageCircle, Shield, Brain, ArrowRight, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function LandingPage() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const getDashboardLink = () => {
    return userRole === "psicologo" ? "/dashboard/alerts" : "/dashboard";
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.reload(); // Recargar para limpiar estado
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfd] text-slate-900 selection:bg-primary/20">
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <span className="text-2xl font-serif font-bold tracking-tight">LUMEN</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <Link href="/resources" className="hover:text-primary transition-colors">Recursos</Link>
            <Link href="/emergency" className="hover:text-primary transition-colors text-destructive/80">Emergencia</Link>
            {userRole === "psicologo" && (
              <Link href="/dashboard/alerts" className="hover:text-primary transition-colors font-bold text-primary">Panel de Control</Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-2">
                <Link href={getDashboardLink()}>
                  <Button variant="ghost" className="rounded-full px-6 flex items-center gap-2 text-slate-600">
                    <UserCircle className="h-5 w-5" />
                    Mi Panel
                  </Button>
                </Link>
                <Button 
                  onClick={handleLogout}
                  variant="outline" 
                  className="rounded-full px-4 border-slate-200 text-slate-500 hover:text-destructive hover:border-destructive/20 transition-colors"
                >
                  Salir
                </Button>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="rounded-full px-6">Iniciar Sesión</Button>
                </Link>
                <Link href="/register">
                  <Button className="rounded-full px-6 shadow-lg shadow-primary/20">Registrarse</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-44 pb-32 overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 mb-6 text-sm font-bold tracking-wider text-primary uppercase bg-primary/10 rounded-full">
              Salud Mental Inteligente
            </span>
            <h1 className="text-6xl md:text-8xl font-serif font-bold leading-tight mb-8 tracking-tighter">
              Tu luz en el camino <br /> 
              <span className="text-slate-400 italic">hacia el bienestar.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-slate-500 leading-relaxed mb-12">
              LUMEN combina la inteligencia artificial más avanzada con la ética clínica para ofrecerte un espacio seguro, privado y disponible 24/7.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/chat">
                <Button size="lg" className="h-16 px-10 rounded-2xl text-lg shadow-xl shadow-primary/30 transition-all hover:scale-105 active:scale-95">
                  {user ? "Hablar con la IA" : "Probar Chat Gratis"}
                  <MessageCircle className="ml-3 h-5 w-5" />
                </Button>
              </Link>
              {user ? (
                <Link href={getDashboardLink()}>
                  <Button size="lg" variant="outline" className="h-16 px-10 rounded-2xl text-lg border-2 hover:bg-slate-50 transition-all">
                    {userRole === "psicologo" ? "Ir a Monitoreo" : "Mi Espacio Personal"}
                    <ArrowRight className="ml-3 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Link href="/register">
                  <Button size="lg" variant="outline" className="h-16 px-10 rounded-2xl text-lg border-2 hover:bg-slate-50 transition-all">
                    Comenzar ahora
                    <ArrowRight className="ml-3 h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: <Brain className="h-8 w-8" />,
                title: "IA Empática",
                desc: "Basada en Terapia Cognitivo-Conductual para ofrecerte reflexiones valiosas en cualquier momento."
              },
              {
                icon: <Shield className="h-8 w-8" />,
                title: "Privacidad Total",
                desc: "Tus conversaciones son privadas y están protegidas con los más altos estándares de seguridad."
              },
              {
                icon: <UserCircle className="h-8 w-8" />,
                title: "Red de Apoyo",
                desc: "En caso de crisis, nuestro sistema alerta automáticamente a profesionales calificados."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="p-8 rounded-3xl bg-slate-50/50 border border-slate-100 hover:border-primary/20 transition-all hover:shadow-xl hover:shadow-slate-200/50 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <Sparkles className="h-5 w-5" />
            <span className="font-serif font-bold">LUMEN</span>
          </div>
          <p className="text-sm text-slate-400">
            © 2024 LUMEN Health. Todos los derechos reservados.
          </p>
          <div className="flex gap-8 text-sm text-slate-400">
            <Link href="#" className="hover:text-primary">Privacidad</Link>
            <Link href="#" className="hover:text-primary">Términos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
