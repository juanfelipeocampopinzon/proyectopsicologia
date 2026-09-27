"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, ArrowRight, User, Mail, Lock } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState(""); // Nuevo campo
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!auth || !db) {
      setError("Firebase no está configurado correctamente en el entorno. Revisa el archivo .env.local.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: name });

      // Verificar si el código es para psicólogos
      const isPsychologist = inviteCode.trim() === "LUMEN-PRO-2024";
      const role = isPsychologist ? "psicologo" : "paciente";

      // Guardar perfil en Firestore con el rol detectado
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        role: role,
        createdAt: serverTimestamp()
      });

      // Redirigir según el rol
      if (isPsychologist) {
        router.push("/dashboard/alerts");
      } else {
        router.push("/chat");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 items-center justify-center shadow-lg shadow-primary/20 mb-4">
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">Únete a LUMEN</h1>
          <p className="text-muted-foreground mt-2">Tu espacio seguro para la salud mental</p>
        </div>

        <div className="bg-card border-2 border-border rounded-3xl p-8 shadow-sm">
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="name" 
                  placeholder="Juan Pérez" 
                  className="pl-10 rounded-xl" 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="juan@ejemplo.com" 
                  className="pl-10 rounded-xl" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10 rounded-xl" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inviteCode">Código de Invitación (Opcional)</Label>
              <div className="relative">
                <Sparkles className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="inviteCode" 
                  placeholder="LUMEN-PRO-XXXX" 
                  className="pl-10 rounded-xl border-primary/20 focus:border-primary" 
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-muted-foreground px-1">
                Usa un código profesional para acceder a las herramientas de monitoreo.
              </p>
            </div>

            {error && <p className="text-sm text-destructive font-medium">{error}</p>}

            <Button 
              type="submit" 
              className="w-full h-12 rounded-2xl text-base shadow-lg shadow-primary/20" 
              disabled={loading}
            >
              {loading ? "Creando cuenta..." : "Comenzar mi camino"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-muted-foreground">¿Ya tienes una cuenta? </span>
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Inicia sesión
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
