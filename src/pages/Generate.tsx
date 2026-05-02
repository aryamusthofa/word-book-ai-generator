import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { useAppStore } from "@/store/useAppStore";
import {
  callAI, calcBookStructure, buildSystemPrompt, buildStructurePrompt, buildContentPrompt,
  getLastUsedModel, WRITING_STYLES, AUDIENCES,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Zap, AlertTriangle, CheckCircle, Loader2, ChevronLeft, Download, Eye, BookOpen,
  ChevronDown, ChevronRight, AlertCircle, Crown, RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GeneratePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    apiKeys, selectedModel, settings, setGenerating, setGenerationProgress, setGenerationTopic,
    guestBooksUsed, incrementGuestBooks, addGuestBook, updateGuestBook, cachedTier,
  } = useAppStore();

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
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorDetail, setErrorDetail] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewChapter, setPreviewChapter] = useState<number>(0);
  const [partialBook, setPartialBook] = useState<any>(null); // partial results during generation

  const isGuest = !user;
  const guestLimitReached = isGuest && guestBooksUsed >= 1;

  // Check api keys (supports multi-key array format)
  const hasApiKey = Object.values(apiKeys).some((v) =>
    Array.isArray(v) ? (v as any[]).length > 0 : !!v
  );

  const preview = calcBookStructure(pages);
  const currentLang = i18n.language as any;

  const getEffectiveLimits = () => {
    if (user && limits) return limits;
    // Guest: 1 book max
    return { canGenerate: !guestLimitReached, remaining: guestLimitReached ? 0 : 1, tier: "guest" };
  };

  const effectiveLimits = getEffectiveLimits();

  const handleGenerate = async () => {
    if (!topic.trim()) { setError(t("common.noTopic")); return; }
    if (!hasApiKey) { setError(t("common.noKey")); return; }
    if (!effectiveLimits.canGenerate) { setShowLimitDialog(true); return; }

    setError(""); setIsGenerating(true); setGenerating(true);
    setGenerationTopic(topic); setProgress(0); setCurrentStep(t("generate.stepStructure"));
    setPartialBook(null);

    const genSettings = { ...settings, writingStyle: style, audience, bookLang: lang, customPromptEnabled: customEnabled, customPromptContent: customPrompt };

    let bookId: string | number | null = null;
    let isLocalGuest = false;
    const content: Record<string, string> = {};
    let structure: any[] = [];

    try {
      // Create book record (cloud or local)
      if (user) {
        const bookRes = await createBook.mutateAsync({ topic, lang, pages, writingStyle: style, audience, authorName: settings.authorName, structure: [] } as any);
        bookId = bookRes.id;
      } else {
        bookId = addGuestBook({ topic, lang, pages, writingStyle: style, audience: audience, structure: [], content: {}, wordCount: 0, pageCount: 0, status: "generating" });
        isLocalGuest = true;
      }

      // Build structure
      const systemPrompt = buildSystemPrompt(genSettings);
      const structurePrompt = buildStructurePrompt(topic, preview.chapters, preview.subsPerChap, lang, genSettings);

      const structureResponse = await callAI({
        messages: [{ role: "user", content: structurePrompt }],
        systemPrompt, maxTokens: 2000, selectedModel, apiKeys,
      });

      try {
        const jsonMatch = structureResponse.match(/\[[\s\S]*\]/);
        structure = JSON.parse(jsonMatch ? jsonMatch[0] : structureResponse);
      } catch { structure = []; }

      setProgress(10); setCurrentStep(t("generate.stepWriting"));
      if (isLocalGuest) updateGuestBook(bookId as string, { structure });

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

          let retries = 0, success = false;
          while (retries < 2 && !success) {
            try {
              const contentPrompt = buildContentPrompt(topic, ch[titKey], sec[codeKey], sec[secTitKey], wordTarget, lang, ch[chapKey]);
              const response = await callAI({
                messages: [{ role: "user", content: contentPrompt }],
                systemPrompt: customEnabled && customPrompt ? customPrompt : systemPrompt,
                maxTokens: 2000, selectedModel, apiKeys,
              });
              content[sectionId] = response;
              success = true;
            } catch (err: any) {
              retries++;
              if (retries < 2) await new Promise((r) => setTimeout(r, 2000 * retries));
            }
          }
          if (!success) content[sectionId] = `[Section generation failed. Please regenerate.]`;

          completedSections++;
          const pct = Math.round(10 + (completedSections / totalSections) * 85);
          setProgress(pct); setGenerationProgress(pct);

          // Save partial progress
          const partialData = { id: bookId, topic, lang, authorName: settings.authorName, structure, content: { ...content }, status: "generating" as const };
          setPartialBook(partialData);
          if (isLocalGuest) updateGuestBook(bookId as string, { content: { ...content } });
        }
      }

      // Complete
      const wordCount = Object.values(content).join(" ").split(/\s+/).length;
      const pageCount = Math.ceil(wordCount / 300);
      const lastModel = getLastUsedModel() || selectedModel;
      const colonIdx = lastModel.indexOf(":");
      const providerUsed = lastModel.slice(0, colonIdx);
      const modelUsed = lastModel.slice(colonIdx + 1);

      if (user) {
        await updateBook.mutateAsync({ id: bookId as number, structure, content, status: "completed", wordCount, pageCount, providerUsed, modelUsed });
      } else {
        updateGuestBook(bookId as string, { structure, content, status: "completed", wordCount, pageCount, providerUsed, modelUsed });
        incrementGuestBooks();
      }

      setCompletedBook({ id: bookId, topic, lang, authorName: settings.authorName, structure, content, createdAt: new Date().toISOString(), providerUsed, modelUsed });
      setProgress(100); setGenerationProgress(100);

    } catch (err: any) {
      // SHOW PARTIAL RESULT instead of just an error
      if (partialBook && Object.keys(partialBook.content || {}).length > 0) {
        const pWordCount = Object.values(partialBook.content).join(" ").split(/\s+/).length;
        const pPageCount = Math.ceil(pWordCount / 300);
        const lastModel = getLastUsedModel() || selectedModel;
        const colonIdx = lastModel.indexOf(":");
        const pvdr = lastModel.slice(0, colonIdx);
        const mdl = lastModel.slice(colonIdx + 1);

        if (user && bookId) {
          await updateBook.mutateAsync({ id: bookId as number, structure, content: partialBook.content, status: "interrupted", wordCount: pWordCount, pageCount: pPageCount, providerUsed: pvdr, modelUsed: mdl }).catch(() => {});
        } else if (bookId) {
          updateGuestBook(bookId as string, { structure, content: partialBook.content, status: "interrupted", wordCount: pWordCount, pageCount: pPageCount });
        }
        // Show partial result as completed book with warning
        setCompletedBook({ ...partialBook, status: "interrupted", topic, lang, authorName: settings.authorName });
        setProgress(progress);
      } else {
        setErrorDetail(err.message || t("common.error"));
        setShowErrorDialog(true);
      }
    } finally {
      setIsGenerating(false); setGenerating(false);
    }
  };

  // ---- COMPLETED BOOK VIEW ----
  if (completedBook) {
    const isInterrupted = completedBook.status === "interrupted";
    const structure = completedBook.structure || [];
    const content = completedBook.content || {};
    const isID = completedBook.lang === "id";

    if (showPreview) {
      const chapKey = isID ? "bab" : "chapter";
      const titKey = isID ? "judul" : "title";
      const secKey = isID ? "subbab" : "sections";
      const codeKey = isID ? "kode" : "code";
      const secTitKey = isID ? "judul" : "title";

      const chap = structure[previewChapter];
      const sections = chap?.[secKey] || [];

      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <h2 className="font-bold flex-1 truncate">{completedBook.topic}</h2>
            <Button size="sm" onClick={() => exportToDocx(completedBook)}>
              <Download className="w-4 h-4 mr-1" /> Export
            </Button>
          </div>

          {/* Chapter Nav */}
          <div className="flex gap-2 flex-wrap">
            {structure.map((ch: any, i: number) => (
              <Button key={i} size="sm" variant={previewChapter === i ? "default" : "outline"} onClick={() => setPreviewChapter(i)} className="text-xs">
                {isID ? `Bab ${ch[chapKey]}` : `Ch. ${ch[chapKey]}`}
              </Button>
            ))}
          </div>

          {chap && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-bold text-base mb-4">{chap[titKey]}</h3>
                {sections.map((sec: any) => {
                  const sId = `${chap[chapKey]}_${sec[codeKey]}`;
                  const text = content[sId] || "";
                  return (
                    <div key={sId} className="mb-6">
                      <h4 className="font-semibold text-sm mb-2 text-primary">{sec[codeKey]}. {sec[secTitKey]}</h4>
                      {text ? (
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{text}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">[Content not generated]</p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </motion.div>
      );
    }

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        {isInterrupted && (
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">Generation interrupted</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Partial results shown below — {Object.keys(content).length} of {structure.reduce((a: number, ch: any) => a + ((isID ? ch.subbab : ch.sections)?.length || 0), 0)} sections completed. You can still preview and export what was generated.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className={`border-${isInterrupted ? "yellow" : "green"}-500/30 bg-${isInterrupted ? "yellow" : "green"}-500/5`}>
          <CardContent className="p-6 text-center">
            {isInterrupted
              ? <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
              : <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
            }
            <h2 className="text-xl font-bold mb-1">{isInterrupted ? "Partial Book Generated" : t("generate.done")}</h2>
            <p className="text-muted-foreground">{completedBook.topic}</p>
            <div className="text-xs text-muted-foreground mt-2">
              {Object.keys(content).length} sections • {Object.values(content).join(" ").split(/\s+/).filter(Boolean).length.toLocaleString()} words
            </div>

            <div className="flex gap-2 justify-center mt-4 flex-wrap">
              <Button variant="outline" onClick={() => setShowPreview(true)}>
                <Eye className="w-4 h-4 mr-2" /> Preview
              </Button>
              <Button onClick={() => exportToDocx(completedBook)}>
                <Download className="w-4 h-4 mr-2" /> Export .docx
              </Button>
              {user && (
                <Button variant="outline" onClick={() => navigate("/library")}>
                  <BookOpen className="w-4 h-4 mr-2" /> {t("nav.library")}
                </Button>
              )}
            </div>
            <Button variant="ghost" className="mt-2" onClick={() => { setCompletedBook(null); setPartialBook(null); setProgress(0); }}>
              <RotateCcw className="w-4 h-4 mr-1" /> {t("generate.restart")}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ---- GENERATION IN PROGRESS ----
  if (isGenerating) {
    const completedCount = partialBook ? Object.keys(partialBook.content || {}).length : 0;
    const totalSections = preview.chapters * preview.subsPerChap;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <Loader2 className="w-10 h-10 mx-auto mb-3 animate-spin text-primary" />
              <h2 className="font-bold text-lg">{t("generate.generatingTitle")}</h2>
              <p className="text-sm text-muted-foreground mt-1">{currentStep}</p>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progress}%</span>
              <span>{completedCount}/{totalSections} sections</span>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              ⚠️ Do not close this page. Partial results will be saved if interrupted.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ---- FORM ----
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-20">
      {/* Guest notice */}
      {isGuest && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-3 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0" />
            <div className="flex-1 text-xs">
              <span className="font-medium">Guest mode: </span>
              {guestLimitReached ? "Limit reached (1 book). Register to generate more." : "1 free book. Register for up to 4 books."}
            </div>
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => navigate("/login")}>Register</Button>
          </CardContent>
        </Card>
      )}

      {/* Free user notice */}
      {user && limits && !limits.canGenerate && (
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardContent className="p-3 flex items-center gap-3">
            <Crown className="w-4 h-4 text-orange-500 shrink-0" />
            <div className="flex-1 text-xs">
              <span className="font-medium">Limit reached: </span>
              {limits.booksGenerated}/{limits.maxBooks} books used.
            </div>
            <Button size="sm" className="text-xs h-7" onClick={() => navigate("/premium")}>Upgrade</Button>
          </CardContent>
        </Card>
      )}

      {user && limits && limits.canGenerate && limits.tier !== "premium" && (
        <div className="text-xs text-muted-foreground text-right">
          {limits.remaining} book{limits.remaining !== 1 ? "s" : ""} remaining
        </div>
      )}

      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Topic */}
          <div className="space-y-2">
            <Label>{t("generate.topicLabel")}</Label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t("generate.topicPlaceholder")}
              className="text-base"
            />
          </div>

          {/* Pages Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>{t("generate.pagesLabel")}</Label>
              <span className="text-sm font-semibold text-primary">{pages} pages</span>
            </div>
            <Slider value={[pages]} onValueChange={(v) => setPages(v[0])} min={10} max={150} step={5} className="mt-1" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{preview.chapters} chapters</span>
              <span>~{preview.totalWords.toLocaleString()} words</span>
              <span>{preview.totalSubs} sections</span>
            </div>
          </div>

          {/* Writing Style */}
          <div className="space-y-2">
            <Label>{t("generate.styleLabel")}</Label>
            <div className="flex flex-wrap gap-2">
              {WRITING_STYLES.map((s) => (
                <Badge key={s.id} variant={style === s.id ? "default" : "outline"} className="cursor-pointer px-3 py-1" onClick={() => setStyle(s.id)}>
                  {(s.label as any)[currentLang] || s.label.en}
                </Badge>
              ))}
            </div>
          </div>

          {/* Audience */}
          <div className="space-y-2">
            <Label>{t("generate.audienceLabel")}</Label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {AUDIENCES.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{(a.label as any)[currentLang] || a.label.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Book Language */}
          <div className="space-y-2">
            <Label>{t("generate.langLabel")}</Label>
            <Select value={lang} onValueChange={setLang}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[["en","English"],["id","Bahasa Indonesia"],["es","Español"],["fr","Français"],["de","Deutsch"],["ja","日本語"],["ko","한국어"],["pt","Português"],["ar","العربية"],["zh","中文"],["hi","हिन्दी"],["ru","Русский"]].map(([v,l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Prompt */}
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
                <Textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} rows={3} placeholder={t("generate.customSystemLabel")} />
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md p-3">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <Button
            className="w-full" size="lg"
            onClick={handleGenerate}
            disabled={isGenerating || guestLimitReached || (!!user && !!limits && !limits.canGenerate)}
          >
            <Zap className="w-4 h-4 mr-2" />
            {guestLimitReached ? "Register to Generate More" : t("generate.btnGenerate")}
          </Button>
        </CardContent>
      </Card>

      {/* Limit Dialog */}
      <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Crown className="w-5 h-5 text-yellow-500" /> {t("generate.limitReached")}</DialogTitle>
            <DialogDescription>
              {isGuest
                ? "You've used your 1 free guest book. Register for a free account to get 4 books."
                : `You've used all ${limits?.maxBooks} books on your free plan. Upgrade to premium for unlimited books.`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            {isGuest
              ? <Button className="flex-1" onClick={() => navigate("/login")}>Register Free</Button>
              : <Button className="flex-1" onClick={() => navigate("/premium")}>Upgrade to Premium</Button>
            }
            <Button variant="outline" onClick={() => setShowLimitDialog(false)}>{t("common.cancel")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-5 h-5" /> Generation Failed</DialogTitle>
            <DialogDescription>Something went wrong during generation.</DialogDescription>
          </DialogHeader>
          <div className="bg-muted/50 rounded-md p-3 text-xs font-mono text-muted-foreground max-h-32 overflow-y-auto">
            {errorDetail}
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => { setShowErrorDialog(false); handleGenerate(); }}>
              <RotateCcw className="w-4 h-4 mr-2" /> Retry
            </Button>
            <Button variant="outline" onClick={() => setShowErrorDialog(false)}>{t("common.cancel")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
