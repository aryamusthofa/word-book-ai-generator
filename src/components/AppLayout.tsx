import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import {
  Home, MessageSquare, Library, Settings, BookOpen, Menu, Sun, Moon, Globe,
  Zap, ChevronRight, User, LogOut, Crown, Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Apply theme immediately to avoid flash — call before React renders
function applyTheme(theme: string) {
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const active = theme === "system" ? systemTheme : theme;
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(active);
  return active as "light" | "dark";
}

const navItems = [
  { path: "/", icon: Home, labelKey: "nav.home" },
  { path: "/chat", icon: MessageSquare, labelKey: "nav.chat" },
  { path: "/library", icon: Library, labelKey: "nav.library" },
  { path: "/settings", icon: Settings, labelKey: "nav.settings" },
];

const LANGUAGES = [
  { code: "en", flag: "🇺🇸", name: "English" },
  { code: "id", flag: "🇮🇩", name: "Bahasa Indonesia" },
  { code: "es", flag: "🇪🇸", name: "Español" },
  { code: "fr", flag: "🇫🇷", name: "Français" },
  { code: "de", flag: "🇩🇪", name: "Deutsch" },
  { code: "ja", flag: "🇯🇵", name: "日本語" },
  { code: "ko", flag: "🇰🇷", name: "한국어" },
  { code: "pt", flag: "🇧🇷", name: "Português" },
  { code: "ar", flag: "🇸🇦", name: "العربية" },
  { code: "zh", flag: "🇨🇳", name: "中文" },
  { code: "hi", flag: "🇮🇳", name: "हिन्दी" },
  { code: "ru", flag: "🇷🇺", name: "Русский" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme, appLang, setAppLang, sidebarOpen, setSidebarOpen, apiKeys } = useAppStore();
  const { user } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation();

  const [activeTheme, setActiveTheme] = useState<"light" | "dark">(() => applyTheme(theme));
  const [showLangModal, setShowLangModal] = useState(false);

  const hasApiKey = Object.values(apiKeys).some((v) =>
    Array.isArray(v) ? (v as any[]).length > 0 : !!v
  );

  useEffect(() => {
    const active = applyTheme(theme);
    setActiveTheme(active);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => { if (theme === "system") setActiveTheme(applyTheme("system")); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  // Persist language on mount
  useEffect(() => { if (appLang && i18n.language !== appLang) i18n.changeLanguage(appLang); }, []);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync().catch(() => {});
    window.location.href = "/welcome";
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setAppLang(lang);
    setShowLangModal(false);
  };

  const currentLang = LANGUAGES.find((l) => l.code === appLang);

  const NavContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg">Word AI</span>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); onNavigate?.(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              {t(item.labelKey)}
              {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
          );
        })}

        <button
          onClick={() => { navigate("/generate"); onNavigate?.(); }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-2 ${
            location.pathname === "/generate" ? "bg-primary text-primary-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          <Zap className="w-5 h-5" />
          {t("nav.generate")}
        </button>

        {!hasApiKey && (
          <button
            onClick={() => { navigate("/settings"); onNavigate?.(); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors mt-2"
          >
            <Key className="w-4 h-4" />
            Add API key to start
          </button>
        )}
      </nav>

      <div className="p-4 border-t space-y-3">
        {/* Theme Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{t("settings.theme")}</span>
          <div className="flex gap-1 bg-accent rounded-lg p-0.5">
            {(["light","dark","system"] as const).map((th) => (
              <button key={th} onClick={() => setTheme(th)} className={`p-1.5 rounded-md transition-colors ${theme === th ? "bg-background shadow-sm" : ""}`}>
                {th === "light" ? <Sun className="w-3.5 h-3.5" /> : th === "dark" ? <Moon className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>

        {/* Language Button */}
        <button
          onClick={() => setShowLangModal(true)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-accent transition-colors"
        >
          <span className="flex items-center gap-2"><Globe className="w-3.5 h-3.5" />{t("settings.language")}</span>
          <span>{currentLang?.flag || "🌐"} {currentLang?.name?.slice(0, 8) || "English"}</span>
        </button>

        {/* User */}
        {user ? (
          <div className="flex items-center gap-2 pt-1">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                {user.name?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user.name || "User"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{(user as any).tier === "premium" ? "✨ Premium" : (user as any).tier === "free" ? "Free" : "Guest"}</p>
            </div>
            {(user as any).tier === "premium" && <Crown className="w-4 h-4 text-amber-500 shrink-0" />}
            <button onClick={handleLogout} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/login")}>
            <User className="w-4 h-4 mr-2" /> {t("auth.loginBtn")}
          </Button>
        )}
      </div>
    </div>
  );

  // Bottom nav for mobile
  const MobileBottomNav = () => (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button key={item.path} onClick={() => navigate(item.path)} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
            </button>
          );
        })}
        <button onClick={() => navigate("/generate")} className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground">
          <Zap className="w-5 h-5" />
          <span className="text-[10px] font-medium">Generate</span>
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center px-4">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <NavContent onNavigate={() => setSidebarOpen(false)} />
            </SheetContent>
          </Sheet>
          <BookOpen className="ml-2 w-5 h-5 text-primary" />
          <span className="ml-2 font-bold">Word AI</span>
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => setShowLangModal(true)} className="p-2 rounded-md hover:bg-accent">
              <span className="text-base">{currentLang?.flag || "🌐"}</span>
            </button>
            <button onClick={() => setTheme(activeTheme === "dark" ? "light" : "dark")} className="p-2 rounded-md hover:bg-accent">
              {activeTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {user ? (
              <Avatar className="w-7 h-7 cursor-pointer" onClick={() => navigate("/settings")}>
                <AvatarFallback className="bg-primary/20 text-primary text-xs">{user.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
            ) : (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate("/login")}>Login</Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 border-r bg-card z-40">
          <NavContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 min-h-screen pb-20 lg:pb-0">
          <div className="max-w-4xl mx-auto p-4 lg:p-8">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav />

      {/* Language Modal */}
      <Dialog open={showLangModal} onOpenChange={setShowLangModal}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Globe className="w-4 h-4" /> Choose Language</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm transition-colors ${
                  appLang === lang.code ? "border-primary bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="truncate">{lang.name}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
