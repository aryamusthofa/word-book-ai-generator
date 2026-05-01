import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  MessageSquare,
  Zap,
  Crown,
  BookText,
  FileText,
  ScrollText,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isGenerating, generationProgress, generationTopic } = useAppStore();

  const { data: books } = trpc.books.list.useQuery(undefined, { enabled: !!user });
  const { data: stats } = trpc.books.stats.useQuery(undefined, { enabled: !!user });
  const { data: limits } = trpc.books.checkLimits.useQuery(undefined, { enabled: !!user });

  const recentBooks = books?.slice(0, 3) || [];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-1">{t("home.heroTitle")}</h1>
                <p className="text-muted-foreground text-sm">{t("home.heroSub")}</p>
              </div>
              {user?.tier === "premium" && (
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Button variant="secondary" onClick={() => navigate("/chat")} className="h-auto py-3">
                <MessageSquare className="w-4 h-4 mr-2" />
                <div className="text-left">
                  <div className="text-sm font-medium">{t("home.quickChat")}</div>
                </div>
              </Button>
              <Button onClick={() => navigate("/generate")} className="h-auto py-3">
                <Zap className="w-4 h-4 mr-2" />
                <div className="text-left">
                  <div className="text-sm font-medium">{t("home.quickGen")}</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Generation Progress */}
      {isGenerating && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium">{t("generate.progress")}</span>
                <span className="text-xs text-muted-foreground ml-auto">{generationProgress}%</span>
              </div>
              <Progress value={generationProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2 truncate">{generationTopic}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <BookText className="w-5 h-5 mx-auto mb-1 text-primary" />
              <div className="text-xl font-bold">{stats.books}</div>
              <div className="text-xs text-muted-foreground">{t("home.statsBooks")}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <FileText className="w-5 h-5 mx-auto mb-1 text-primary" />
              <div className="text-xl font-bold">{(stats.words / 1000).toFixed(1)}k</div>
              <div className="text-xs text-muted-foreground">{t("home.statsWords")}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <ScrollText className="w-5 h-5 mx-auto mb-1 text-primary" />
              <div className="text-xl font-bold">{stats.pages}</div>
              <div className="text-xs text-muted-foreground">{t("home.statsPages")}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Limits */}
      {limits && limits.remaining >= 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t("home.booksRemaining", { count: limits.remaining })}</p>
              <p className="text-xs text-muted-foreground">{limits.tier === "guest" ? t("welcome.guestNotice") : ""}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate("/premium")}>
              <Sparkles className="w-3 h-3 mr-1" />
              {t("premium.upgradeBtn")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Books */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">{t("home.recentBooks")}</h2>
          {books && books.length > 3 && (
            <Button variant="ghost" size="sm" onClick={() => navigate("/library")}>
              {t("library.view")} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

        {recentBooks.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <h3 className="font-medium mb-1">{t("home.noBooks")}</h3>
              <p className="text-sm text-muted-foreground mb-4">{t("home.noBooksDesc")}</p>
              <Button onClick={() => navigate("/generate")}>
                <Zap className="w-4 h-4 mr-2" />
                {t("home.quickGen")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentBooks.map((book) => (
              <Card
                key={book.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navigate(`/library?book=${book.id}`)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{book.topic}</p>
                    <p className="text-xs text-muted-foreground">
                      {book.pageCount} {t("library.pages")} • {new Date(book.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={book.status === "completed" ? "default" : "secondary"}>
                    {book.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
