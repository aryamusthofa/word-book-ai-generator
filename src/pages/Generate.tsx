import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { useAppStore } from "@/store/useAppStore";
import {
  callAI,
  calcBookStructure,
  buildSystemPrompt,
  buildStructurePrompt,
  buildContentPrompt,
  getLastUsedModel,
  WRITING_STYLES,
  AUDIENCES,
} from "@/lib/ai-service";
import { exportToDocx } from "@/lib/docx-export";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Zap,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ChevronLeft,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GeneratePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { apiKeys, selectedModel, settings, setGenerating, setGenerationProgress, setGenerationTopic } = useAppStore();

  const { data: limits } = trpc.books.checkLimits.useQuery(undefined, { enabled: !!user });
  const createBook = trpc.books.create.useMutation();
  const updateBook = trpc.books.update.useMutation();

  const [topic, setTopic] = useState("");
  const [pages, setPages] = useState(50);
  const [style, setStyle] = useState(settings.writingStyle);
  const [audience, setAudience] = useState(settings.audience);
  const [lang, setLang] = useState(settings.bookLang);
  const [customEnabled, setCustomEnabled] = useState(settings.customPromptEnabled);
  const [customPrompt, setCustomPrompt] = useState(settings.customPromptContent);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [error, setError] = useState("");
  const [completedBook, setCompletedBook] = useState<any>(null);
  const [showLimitDialog, setShowLimitDialog] = useState(false);

  const preview = calcBookStructure(pages);
  const currentLang = i18n.language as keyof typeof WRITING_STYLES[0]["label"];

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError(t("common.noTopic"));
      return;
    }
    if (!Object.values(apiKeys).some((k) => k)) {
      setError(t("common.noKey"));
      return;
    }
    if (limits && !limits.canGenerate) {
      setShowLimitDialog(true);
      return;
    }

    setError("");
    setIsGenerating(true);
    setGenerating(true);
    setGenerationTopic(topic);
    setProgress(0);
    setCurrentStep(t("generate.stepStructure"));

    const genSettings = {
      ...settings,
      writingStyle: style,
      audience,
      bookLang: lang,
      authorName: settings.authorName,
      customPromptEnabled: customEnabled,
      customPromptContent: customPrompt,
    };

    try {
      // Create book record
      const bookRes = await createBook.mutateAsync({
        topic,
        lang,
        pages,
        writingStyle: style,
        audience,
        authorName: settings.authorName,
        structure: [],
      } as any);
      const bookId = bookRes.id;

      // Build structure
      const systemPrompt = buildSystemPrompt(genSettings);
      const structurePrompt = buildStructurePrompt(topic, preview.chapters, preview.subsPerChap, lang, genSettings);

      const structureResponse = await callAI({
        messages: [{ role: "user", content: structurePrompt }],
        systemPrompt,
        maxTokens: 2000,
        selectedModel,
        apiKeys,
      });

      let structure: any[] = [];
      try {
        const jsonMatch = structureResponse.match(/\[[\s\S]*\]/);
        structure = JSON.parse(jsonMatch ? jsonMatch[0] : structureResponse);
      } catch {
        structure = [];
      }

      setProgress(10);
      setCurrentStep(t("generate.stepWriting"));

      const content: Record<string, string> = {};
      const totalSections = structure.reduce((acc: number, ch: any) => acc + (ch.subbab?.length || ch.sections?.length || 0), 0);
      let completedSections = 0;

      for (let ci = 0; ci < structure.length; ci++) {
        const ch = structure[ci];
        const chapKey = lang === "id" ? "bab" : "chapter";
        const titKey = lang === "id" ? "judul" : "title";
        const secKey = lang === "id" ? "subbab" : "sections";
        const codeKey = lang === "id" ? "kode" : "code";
        const secTitKey = lang === "id" ? "judul" : "title";

        const sections = ch[secKey] || [];
        for (const sec of sections) {
          const sectionId = `${ch[chapKey]}_${sec[codeKey]}`;
          const wordTarget = Math.floor(preview.totalWords / totalSections);

          let retries = 0;
          let success = false;
          while (retries < 2 && !success) {
            try {
              const contentPrompt = buildContentPrompt(
                topic,
                ch[titKey],
                sec[codeKey],
                sec[secTitKey],
                wordTarget,
                lang,
                ch[chapKey]
              );
              const response = await callAI({
                messages: [{ role: "user", content: contentPrompt }],
                systemPrompt: customEnabled && customPrompt ? customPrompt : systemPrompt,
                maxTokens: 2000,
                selectedModel,
                apiKeys,
              });
              content[sectionId] = response;
              success = true;
            } catch (err: any) {
              retries++;
              if (retries < 2) await new Promise((r) => setTimeout(r, 2000 * retries));
            }
          }
          if (!success) content[sectionId] = "";

          completedSections++;
          const pct = Math.round(10 + (completedSections / totalSections) * 85);
          setProgress(pct);
          setGenerationProgress(pct);
        }
      }

      // Complete
      const wordCount = Object.values(content).join(" ").split(/\s+/).length;
      const pageCount = Math.ceil(wordCount / 300);
      const lastModel = getLastUsedModel() || selectedModel;
      const [providerUsed, modelUsed] = lastModel.split(":");

      await updateBook.mutateAsync({
        id: bookId,
        structure,
        content,
        status: "completed",
        wordCount,
        pageCount,
        providerUsed,
        modelUsed,
      });

      const book = {
        id: bookId,
        topic,
        lang,
        authorName: settings.authorName,
        structure,
        content,
        createdAt: new Date().toISOString(),
      };

      setCompletedBook(book);
      setProgress(100);
      setGenerationProgress(100);
    } catch (err: any) {
      setError(err.message || t("common.error"));
    } finally {
      setIsGenerating(false);
      setGenerating(false);
    }
  };

  if (completedBook) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <h2 className="text-xl font-bold mb-1">{t("generate.done")}</h2>
            <p className="text-muted-foreground">{completedBook.topic}</p>
            <div className="flex gap-2 justify-center mt-4">
              <Button onClick={() => exportToDocx(completedBook)}>
                <Download className="w-4 h-4 mr-2" />
                {t("library.download")} .docx
              </Button>
              <Button variant="outline" onClick={() => navigate("/library")}>
                {t("nav.library")}
              </Button>
            </div>
            <Button variant="ghost" className="mt-2" onClick={() => setCompletedBook(null)}>
              {t("generate.restart")}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (isGenerating) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="font-medium">{currentStep}</span>
            </div>
            <Progress value={progress} className="h-3" />
            <p className="text-center mt-2 text-sm text-muted-foreground">{progress}%</p>
            <p className="text-xs text-muted-foreground text-center mt-1 truncate">{topic}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ChevronLeft className="w-4 h-4 mr-1" />
        </Button>
        <h1 className="text-xl font-bold">{t("generate.title")}</h1>
      </div>

      {error && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4 flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label>{t("generate.topicLabel")}</Label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t("generate.topicPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("generate.pagesLabel")}: {pages}</Label>
            <Slider value={[pages]} onValueChange={(v) => setPages(v[0])} min={10} max={200} step={5} />
          </div>

          <Card className="bg-accent/50">
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground mb-2">{t("generate.previewTitle")}</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold">{preview.chapters}</div>
                  <div className="text-xs text-muted-foreground">{t("generate.chapters")}</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{preview.totalSubs}</div>
                  <div className="text-xs text-muted-foreground">{t("generate.sections")}</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{(preview.totalWords / 1000).toFixed(1)}k</div>
                  <div className="text-xs text-muted-foreground">{t("generate.words")}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label>{t("generate.styleLabel")}</Label>
            <div className="flex flex-wrap gap-2">
              {WRITING_STYLES.map((s) => {
                const label = s.label[currentLang] || s.label.en;
                return (
                  <Badge
                    key={s.id}
                    variant={style === s.id ? "default" : "outline"}
                    className="cursor-pointer px-3 py-1"
                    onClick={() => setStyle(s.id)}
                  >
                    {label}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("generate.audienceLabel")}</Label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCES.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.label[currentLang] || a.label.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("generate.langLabel")}</Label>
            <Select value={lang} onValueChange={setLang}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="id">Bahasa Indonesia</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
                <SelectItem value="ko">한국어</SelectItem>
                <SelectItem value="pt">Português</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="cursor-pointer">{t("generate.customPrompt")}</Label>
              <p className="text-xs text-muted-foreground">{t("generate.customPromptDesc")}</p>
            </div>
            <Switch checked={customEnabled} onCheckedChange={setCustomEnabled} />
          </div>

          <AnimatePresence>
            {customEnabled && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                <Textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={4}
                  placeholder={t("generate.customSystemLabel")}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <Button className="w-full" size="lg" onClick={handleGenerate} disabled={isGenerating}>
            <Zap className="w-4 h-4 mr-2" />
            {t("generate.btnGenerate")}
          </Button>
        </CardContent>
      </Card>

      {/* Limit Dialog */}
      <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("generate.limitReached")}</DialogTitle>
            <DialogDescription>{t("premium.subtitle")}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => navigate("/premium")}>
              {t("premium.upgradeBtn")}
            </Button>
            <Button variant="outline" onClick={() => setShowLimitDialog(false)}>
              {t("common.cancel")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
