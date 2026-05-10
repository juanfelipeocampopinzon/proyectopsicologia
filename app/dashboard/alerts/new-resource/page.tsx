"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, BookOpen, Layout, Type, Tag, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function NewResourcePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const router = useRouter();

  // Campos del formulario
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Ansiedad");
  const [content, setContent] = useState("");
  const [resourceType, setResourceType] = useState("local"); // 'local' o 'external'
  const [externalUrl, setExternalUrl] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    if (resourceType === 'local' && !content) return;
    if (resourceType === 'external' && !externalUrl) return;

    setPublishing(true);
    try {
      await addDoc(collection(db, "resources"), {
        title,
        description,
        category,
        content: resourceType === 'local' ? content : "",
        externalUrl: resourceType === 'external' ? externalUrl : "",
        resourceType,
        authorId: user.uid,
        authorName: user.displayName || "Psicólogo LUMEN",
        createdAt: serverTimestamp(),
        type: resourceType === 'external' ? "link" : "article",
        color: resourceType === 'external' ? "from-blue-500/20 to-indigo-500/20" : "from-primary/20 to-secondary/20",
      });
      router.push("/dashboard/alerts");
    } catch (error) {
      console.error("Error publishing resource:", error);
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 text-slate-900">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard/alerts" className="inline-flex items-center text-slate-500 hover:text-primary mb-8 transition-colors group">
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Volver al Dashboard
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[40px] p-8 md:p-12 shadow-xl border border-slate-100"
        >
          <div className="flex items-center gap-4 mb-10">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary">
              <BookOpen className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold">Publicar Nuevo Recurso</h1>
              <p className="text-slate-500">Publica contenido propio o recomienda sitios web certificados.</p>
            </div>
          </div>

          <form onSubmit={handlePublish} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Type className="h-4 w-4 text-primary" /> Tipo de Recurso
                </label>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
                  <button 
                    type="button"
                    onClick={() => setResourceType("local")}
                    className={cn("flex-1 py-3 rounded-xl font-bold transition-all", resourceType === 'local' ? "bg-white shadow-sm text-primary" : "text-slate-500")}
                  >
                    Artículo Propio
                  </button>
                  <button 
                    type="button"
                    onClick={() => setResourceType("external")}
                    className={cn("flex-1 py-3 rounded-xl font-bold transition-all", resourceType === 'external' ? "bg-white shadow-sm text-primary" : "text-slate-500")}
                  >
                    Enlace Externo
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Tag className="h-4 w-4 text-primary" /> Categoría
                </label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-primary/30 outline-none appearance-none cursor-pointer"
                >
                  <option>Ansiedad</option>
                  <option>Depresión</option>
                  <option>Autoestima</option>
                  <option>Relaciones</option>
                  <option>Meditación</option>
                  <option>Sueño</option>
                  <option>Oficial / Guías</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <Type className="h-4 w-4 text-primary" /> Título del Recurso
              </label>
              <input 
                value={title || ""}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Guía de la OMS sobre el estrés laboral"
                className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-primary/30 outline-none"
                required
              />
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <Layout className="h-4 w-4 text-primary" /> Resumen / Descripción
              </label>
              <input 
                value={description || ""}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explica brevemente de qué trata este recurso..."
                className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-primary/30 outline-none"
                required
              />
            </div>

            {resourceType === 'external' ? (
              <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                <label className="flex items-center gap-2 text-sm font-bold text-blue-600">
                  <LinkIcon className="h-4 w-4" /> URL del Sitio Web Certificado
                </label>
                <input 
                  value={externalUrl || ""}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://www.who.int/es/news-room/fact-sheets/detail/mental-health-at-work"
                  className="w-full h-14 px-6 rounded-2xl bg-blue-50 border-2 border-blue-100 focus:bg-white focus:border-blue-300 outline-none text-blue-700"
                  required
                />
              </div>
            ) : (
              <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <BookOpen className="h-4 w-4 text-primary" /> Contenido del Artículo
                </label>
                <textarea 
                  value={content || ""}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escribe aquí tu artículo profesional..."
                  className="w-full min-h-[300px] p-8 rounded-[32px] bg-slate-50 border-transparent focus:bg-white focus:border-primary/30 outline-none resize-none leading-relaxed text-slate-700"
                  required
                />
              </div>
            )}

            <div className="pt-6 flex justify-end">
              <Button 
                type="submit" 
                disabled={publishing}
                className="h-16 px-10 rounded-2xl text-lg shadow-xl shadow-primary/20 flex items-center gap-3 transition-all hover:scale-[1.02] active:scale-95"
              >
                {publishing ? "Publicando..." : "Publicar ahora"}
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
