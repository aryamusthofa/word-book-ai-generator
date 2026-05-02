import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/store/useAppStore";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { BookOpen, Zap, Globe, Shield, Sparkles, Crown, ChevronRight, Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

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

// Apply theme before render to avoid flash
function applyTheme(theme: string) {
  const sys = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const active = theme === "system" ? sys : theme;
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(active);
  return active;
}

export default function WelcomePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { theme, setTheme, appLang, setAppLang, setGuestId, incrementGuestBooks } = useAppStore();
  const createGuest = trpc.auth.createGuest.useMutation();
  const [showLangModal, setShowLangModal] = useState(false);
  const [activeTheme, setActiveTheme] = useState(() => applyTheme(theme));

  useEffect(() => {
    // Persist lang on mount
    if (appLang && i18n.language !== appLang) i18n.changeLanguage(appLang);
  }, []);

  const toggleTheme = () => {
    const next = activeTheme === "dark" ? "light" : "dark";
    setTheme(next);
    setActiveTheme(applyTheme(next));
  };

  const changeLang = (code: string) => {
    setAppLang(code);
    i18n.changeLanguage(code);
    setShowLangModal(false);
  };

  const handleGuest = async () => {
    try {
      const res = await createGuest.mutateAsync();
      setGuestId(res.guestId);
    } catch {}
    navigate("/");
  };

  const currentLang = LANGUAGES.find((l) => l.code === appLang);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <span className="font-bold text-sm">Word AI Book Generator</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowLangModal(true)} className="p-2 rounded-lg hover:bg-accent text-base">
            {currentLang?.flag || "🌐"}
          </button>
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-accent">
            {activeTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-sm w-full space-y-5"
        >
          {/* Hero */}
          <div className="text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">{t("welcome.title")}</h1>
            <p className="text-muted-foreground text-sm">{t("welcome.subtitle")}</p>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="secondary" className="text-xs"><Sparkles className="w-3 h-3 mr-1" />14+ AI Providers</Badge>
            <Badge variant="secondary" className="text-xs"><Globe className="w-3 h-3 mr-1" />12 Languages</Badge>
            <Badge variant="secondary" className="text-xs"><Shield className="w-3 h-3 mr-1" />No Ads</Badge>
            <Badge variant="secondary" className="text-xs"><Crown className="w-3 h-3 mr-1" />Freemium</Badge>
          </div>

          {/* Auth Buttons */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <Button className="w-full" size="lg" onClick={() => navigate("/login")}>
                <Sparkles className="w-4 h-4 mr-2" />
                {t("auth.loginBtn")}
                <ChevronRight className="w-4 h-4 ml-auto" />
              </Button>
              <Button variant="outline" className="w-full" size="lg" onClick={() => navigate("/login?tab=register")}>
                Create Free Account
                <ChevronRight className="w-4 h-4 ml-auto" />
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">{t("welcome.or")}</span>
                </div>
              </div>

              <Button
                variant="secondary" className="w-full" size="lg"
                onClick={handleGuest} disabled={createGuest.isPending}
              >
                <Zap className="w-4 h-4 mr-2" />
                {t("welcome.guestBtn")}
              </Button>
              <p className="text-xs text-muted-foreground text-center">{t("welcome.guestNotice")}</p>
            </CardContent>
          </Card>

          {/* Tier Comparison */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { icon: "👤", title: "Guest", desc: "1 book\nLimited models" },
              { icon: "✉️", title: "Free", desc: "4 books\nBasic models" },
              { icon: "👑", title: "Premium", desc: "Unlimited\nAll models" },
            ].map((tier) => (
              <div key={tier.title} className="rounded-xl border bg-card p-3">
                <div className="text-xl mb-1">{tier.icon}</div>
                <div className="text-xs font-semibold">{tier.title}</div>
                <div className="text-[10px] text-muted-foreground whitespace-pre-line mt-0.5">{tier.desc}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

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
                onClick={() => changeLang(lang.code)}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm transition-colors ${
                  appLang === lang.code ? "border-primary bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="truncate text-xs">{lang.name}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
