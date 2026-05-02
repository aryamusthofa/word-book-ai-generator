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
  BookOpen, MessageSquare, Zap, Crown, BookText, FileText,
  ScrollText, ArrowRight, Sparkles, Key, AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isGenerating, generationProgress, generationTopic, apiKeys, guestBooks, guestBooksUsed } = useAppStore();

  const { data: books } = trpc.books.list.useQuery(undefined, { enabled: !!user });
  const { data: stats } = trpc.books.stats.useQuery(undefined, { enabled: !!user });
  const { data: limits } = trpc.books.checkLimits.useQuery(undefined, { enabled: !!user });

  const hasApiKey = Object.values(apiKeys).some((v) =>
    Array.isArray(v) ? (v as any[]).length > 0 : !!v
  );

  // Merge cloud + guest recent books
  const cloudRecent = (books || []).slice(0, 3).map((b) => ({ ...b, isGuest: false }));
  const guestRecent = guestBooks.slice(0, 3).map((b) => ({ ...b, isGuest: true, createdAt: new Date(b.createdAt).toISOString() }));
  const recentBooks = user ? cloudRecent : guestRecent;

  // Stats for guest
  const guestStats = {
    books: guestBooks.length,
    words: guestBooks.reduce((a, b) => a + (b.wordCount || 0), 0),
    pages: guestBooks.reduce((a, b) => a + (b.pageCount || 0), 0),
  };
  const displayStats = user ? stats : (guestBooks.length > 0 ? guestStats : null);

  return (
    <div className="space-y-5 pb-4">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h1 className="text-xl font-bold">{t("home.heroTitle")}</h1>
                <p className="text-muted-foreground text-sm">{t("home.heroSub")}</p>
              </div>
              {(user as any)?.tier === "premium" && (
                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                  <Crown className="w-3 h-3 mr-1" /> Premium
                </Badge>
              )}
              {!user && (
                <Badge variant="outline" className="text-xs">Guest</Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Button variant="secondary" onClick={() => navigate("/chat")} className="h-auto py-3">
                <MessageSquare className="w-4 h-4 mr-2 shrink-0" />
                <div className="text-left">
                  <div className="text-sm font-medium">{t("home.quickChat")}</div>
                </div>
              </Button>
              <Button onClick={() => navigate("/generate")} className="h-auto py-3">
                <Zap className="w-4 h-4 mr-2 shrink-0" />
                <div className="text-left">
                  <div className="text-sm font-medium">{t("home.quickGen")}</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* No API Key warning */}
      {!hasApiKey && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-4 flex items-center gap-3">
              <Key className="w-5 h-5 text-yellow-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">No API key yet</p>
                <p className="text-xs text-muted-foreground">Add one to start generating books</p>
              </div>
              <Button size="sm" onClick={() => navigate("/settings")}>Add Key</Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Guest notice */}
      {!user && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Guest mode</p>
              <p className="text-xs text-muted-foreground">
                {guestBooksUsed >= 1
                  ? "You've used your 1 guest book. Register for 4 free books."
                  : `${1 - guestBooksUsed} book left. Register for 4 free books.`}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate("/login")}>Register</Button>
          </CardContent>
        </Card>
      )}

      {/* Generation In Progress */}
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
              <Button size="sm" variant="outline" className="mt-3 w-full text-xs" onClick={() => navigate("/generate")}>
                View Progress →
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats */}
      {displayStats && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: BookText, value: displayStats.books, label: t("home.statsBooks") },
            { icon: FileText, value: `${((displayStats.words || 0) / 1000).toFixed(1)}k`, label: t("home.statsWords") },
            { icon: ScrollText, value: displayStats.pages || 0, label: t("home.statsPages") },
          ].map(({ icon: Icon, value, label }) => (
            <Card key={label}>
              <CardContent className="p-4 text-center">
                <Icon className="w-5 h-5 mx-auto mb-1 text-primary" />
                <div className="text-xl font-bold">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Usage Limit Bar (free users only) */}
      {user && limits && limits.tier !== "premium" && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">{t("home.booksRemaining", { count: limits.remaining })}</p>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => navigate("/premium")}>
                <Crown className="w-3 h-3 mr-1 text-amber-500" /> Upgrade
              </Button>
            </div>
            <Progress value={(limits.booksGenerated / limits.maxBooks) * 100} className="h-1.5" />
            <p className="text-xs text-muted-foreground mt-1">{limits.booksGenerated}/{limits.maxBooks} books used</p>
          </CardContent>
        </Card>
      )}

      {/* Premium CTA for free users with no books */}
      {user && limits && limits.tier === "free" && limits.booksGenerated === 0 && (
        <Card className="border-violet-500/20 bg-violet-500/5 cursor-pointer" onClick={() => navigate("/premium")}>
          <CardContent className="p-4 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-violet-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Try Premium free for 14 days</p>
              <p className="text-xs text-muted-foreground">Unlimited books, all models, all features</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      {/* Recent Books */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">{t("home.recentBooks")}</h2>
          {(books?.length || 0) + guestBooks.length > 3 && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/library")}>
              {t("library.view")} <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>

        {recentBooks.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <h3 className="font-medium mb-1">{t("home.noBooks")}</h3>
              <p className="text-sm text-muted-foreground mb-4">{t("home.noBooksDesc")}</p>
              <Button onClick={() => navigate("/generate")}>
                <Zap className="w-4 h-4 mr-2" /> {t("home.quickGen")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentBooks.map((book) => (
              <Card
                key={`${(book as any).isGuest ? "g" : "c"}_${book.id}`}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navigate(`/library?book=${book.id}`)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <BookText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{book.topic}</p>
                    <p className="text-xs text-muted-foreground">
                      {book.pageCount} {t("library.pages")} • {new Date(book.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={book.status === "completed" ? "default" : book.status === "interrupted" ? "outline" : "secondary"} className="shrink-0 text-xs">
                    {book.status === "interrupted" ? "partial" : book.status}
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
