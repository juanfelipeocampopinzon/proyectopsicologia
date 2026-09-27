"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sparkles, MessageCircle, Users, BookOpen, LayoutDashboard, Moon, Sun, AlertCircle, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"
import { useRouter } from "next/navigation"

const navItems = [
  { href: "/", icon: Sparkles, label: "Inicio" },
  { href: "/chat", icon: MessageCircle, label: "Chat" },
  { href: "/professionals", icon: Users, label: "Profesionales" },
  { href: "/resources", icon: BookOpen, label: "Recursos" },
  { href: "/dashboard", icon: LayoutDashboard, label: "Mi cuenta" },
]

export function FloatingNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [isDark, setIsDark] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // La página /chat tiene su propio header completo — no superponer la nav flotante
  const hiddenPaths = ["/chat"]

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  useEffect(() => {
    const darkMode = localStorage.getItem("darkMode") === "true"
    setIsDark(darkMode)
    if (darkMode) {
      document.documentElement.classList.add("dark")
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const toggleDarkMode = () => {
    const newMode = !isDark
    setIsDark(newMode)
    localStorage.setItem("darkMode", String(newMode))
    document.documentElement.classList.toggle("dark")
  }

  if (hiddenPaths.includes(pathname ?? "")) return null

  return (
    <>
      {/* Desktop Floating Nav */}
      <nav
        className={cn(
          "hidden md:flex fixed top-6 left-1/2 -translate-x-1/2 z-50 items-center gap-1 p-2 rounded-2xl transition-all duration-300",
          isScrolled
            ? "bg-background/80 backdrop-blur-xl shadow-lg border border-border"
            : "bg-background/50 backdrop-blur-sm"
        )}
      >
        <Link href="/" className="flex items-center gap-2 px-4 py-2 mr-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-serif font-semibold text-lg">LUMEN</span>
        </Link>

        {navItems.slice(1).map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={cn("rounded-xl gap-2", isActive && "shadow-md")}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden lg:inline">{item.label}</span>
              </Button>
            </Link>
          )
        })}

        <div className="w-px h-6 bg-border mx-2" />

        <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="rounded-xl">
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-xl text-slate-500">
          <LogOut className="h-4 w-4" />
        </Button>

        <Link href="/emergency">
          <Button variant="ghost" size="icon" className="rounded-xl text-destructive hover:text-destructive">
            <AlertCircle className="h-4 w-4" />
          </Button>
        </Link>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4">
        <div className="flex items-center justify-around bg-background/90 backdrop-blur-xl rounded-2xl shadow-lg border border-border p-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="icon"
                  className={cn("rounded-xl h-12 w-12", isActive && "shadow-md")}
                >
                  <item.icon className="h-5 w-5" />
                </Button>
              </Link>
            )
          })}
          <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-xl h-12 w-12">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </nav>
    </>
  )
}
