import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import {
  Home,
  MessageSquare,
  Library,
  Settings,
  BookOpen,
  Menu,
  Sun,
  Moon,
  Globe,
  Zap,
  ChevronRight,
  User,
  LogOut,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { path: "/", icon: Home, labelKey: "nav.home" },
  { path: "/chat", icon: MessageSquare, labelKey: "nav.chat" },
  { path: "/library", icon: Library, labelKey: "nav.library" },
  { path: "/settings", icon: Settings, labelKey: "nav.settings" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme, appLang, setAppLang, sidebarOpen, setSidebarOpen } = useAppStore();
  const { user } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation();

  const [activeTheme, setActiveTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const active = theme === "system" ? systemTheme : theme;
    setActiveTheme(active);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(active);
  }, [theme]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = "/";
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setAppLang(lang);
  };

  const languages = [
    { code: "en", flag: "🇺🇸", name: "English" },
    { code: "id", flag: "🇮🇩", name: "Bahasa Indonesia" },
    { code: "es", flag: "🇪🇸", name: "Español" },
    { code: "fr", flag: "🇫🇷", name: "Français" },
    { code: "de", flag: "🇩🇪", name: "Deutsch" },
    { code: "ja", flag: "🇯🇵", name: "日本語" },
    { code: "ko", flag: "🇰🇷", name: "한국어" },
    { code: "pt", flag: "🇵🇹", name: "Português" },
    { code: "ar", flag: "🇸🇦", name: "العربية" },
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg">Word AI</span>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              {t(item.labelKey)}
              {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
          );
        })}

        <button
          onClick={() => {
            navigate("/generate");
            setSidebarOpen(false);
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors mt-4"
        >
          <Zap className="w-5 h-5" />
          {t("nav.generate")}
        </button>
      </nav>

      <div className="p-4 border-t border-border space-y-3">
        {/* Theme Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{t("settings.theme")}</span>
          <div className="flex gap-1 bg-accent rounded-lg p-0.5">
            <button
              onClick={() => setTheme("light")}
              className={`p-1.5 rounded-md transition-colors ${theme === "light" ? "bg-background shadow-sm" : ""}`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`p-1.5 rounded-md transition-colors ${theme === "dark" ? "bg-background shadow-sm" : ""}`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme("system")}
              className={`p-1.5 rounded-md transition-colors ${theme === "system" ? "bg-background shadow-sm" : ""}`}
            >
              <Globe className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Language Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-accent transition-colors">
              <span className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" />
                {t("settings.language")}
              </span>
              <span>{languages.find((l) => l.code === appLang)?.flag || "🇺🇸"}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-60 overflow-auto">
            {languages.map((lang) => (
              <DropdownMenuItem key={lang.code} onClick={() => changeLanguage(lang.code)}>
                <span className="mr-2">{lang.flag}</span>
                {lang.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User */}
        {user ? (
          <div className="flex items-center gap-2 pt-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                {user.name?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user.name || "User"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email || ""}</p>
            </div>
            {user.tier === "premium" && <Crown className="w-4 h-4 text-amber-500" />}
            <button onClick={handleLogout} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/login")}>
            <User className="w-4 h-4 mr-2" />
            {t("auth.loginBtn")}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${activeTheme} bg-background text-foreground`}>
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <NavContent />
            </SheetContent>
          </Sheet>
          <span className="ml-3 font-bold">Word AI</span>
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Globe className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-60 overflow-auto">
                {languages.map((lang) => (
                  <DropdownMenuItem key={lang.code} onClick={() => changeLanguage(lang.code)}>
                    <span className="mr-2">{lang.flag}</span>
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              onClick={() => setTheme(activeTheme === "dark" ? "light" : "dark")}
              className="p-2 rounded-md hover:bg-accent"
            >
              {activeTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 border-r bg-card z-40">
          <NavContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 min-h-screen">
          <div className="max-w-5xl mx-auto p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
