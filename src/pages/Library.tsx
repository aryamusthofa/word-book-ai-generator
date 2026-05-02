import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { exportToDocx } from "@/lib/docx-export";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  BookText, Download, Trash2, BookOpen, ChevronLeft, FileText, Calendar, Cpu, Eye, AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";

export default function LibraryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { guestBooks, deleteGuestBook } = useAppStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  const [deleteIsGuest, setDeleteIsGuest] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewChapter, setPreviewChapter] = useState(0);

  const { data: cloudBooks, isLoading } = trpc.books.list.useQuery(undefined, { enabled: !!user });
  const deleteBook = trpc.books.delete.useMutation();
  const utils = trpc.useUtils();

  // Merge cloud + guest books
  const allBooks = [
    ...(cloudBooks || []).map((b) => ({ ...b, isGuest: false })),
    ...guestBooks.map((b) => ({ ...b, id: b.id, createdAt: new Date(b.createdAt).toISOString(), isGuest: true })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const selectedBookId = searchParams.get("book");
  const selectedBook = allBooks.find((b) => String(b.id) === selectedBookId);

  const handleDelete = async () => {
    if (!deleteId) return;
    if (deleteIsGuest) {
      deleteGuestBook(deleteId as string);
    } else {
      await deleteBook.mutateAsync({ id: deleteId as number });
      utils.books.list.invalidate();
    }
    setDeleteId(null);
    if (selectedBookId === String(deleteId)) setSearchParams({});
  };

  // ---- BOOK DETAIL VIEW ----
  if (selectedBook && !showPreview) {
    const isID = selectedBook.lang === "id";
    const structure = (selectedBook.structure as any[]) || [];
    const content = (selectedBook.content as Record<string, string>) || {};
    const wordCount = Object.values(content).join(" ").split(/\s+/).filter(Boolean).length;

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSearchParams({})}>
            <ChevronLeft className="w-4 h-4 mr-1" /> {t("common.back")}
          </Button>
          {(selectedBook as any).isGuest && <Badge variant="secondary" className="text-xs">Local</Badge>}
          {selectedBook.status === "interrupted" && (
            <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-500">Partial</Badge>
          )}
        </div>

        <Card>
          <CardContent className="p-6">
            <h1 className="text-xl font-bold mb-2">{selectedBook.topic}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline"><FileText className="w-3 h-3 mr-1" />{selectedBook.pageCount || Math.ceil(wordCount / 300)} pages</Badge>
              <Badge variant="outline"><Calendar className="w-3 h-3 mr-1" />{new Date(selectedBook.createdAt).toLocaleDateString()}</Badge>
              {selectedBook.providerUsed && <Badge variant="outline"><Cpu className="w-3 h-3 mr-1" />{selectedBook.providerUsed}</Badge>}
              <Badge variant="outline">{wordCount.toLocaleString()} words</Badge>
            </div>

            {selectedBook.status === "interrupted" && (
              <div className="mb-4 flex items-start gap-2 text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 rounded-md p-3">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                This book was partially generated. You can still preview and export what was completed.
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => { setShowPreview(true); setPreviewChapter(0); }}>
                <Eye className="w-4 h-4 mr-2" /> Preview
              </Button>
              <Button variant="outline" onClick={() => exportToDocx(selectedBook)}>
                <Download className="w-4 h-4 mr-2" /> Export .docx
              </Button>
              <Button variant="outline" className="text-destructive" onClick={() => { setDeleteId(selectedBook.id); setDeleteIsGuest(!!(selectedBook as any).isGuest); }}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* TOC */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">Table of Contents</h3>
            {structure.length === 0 ? (
              <p className="text-sm text-muted-foreground">Structure not available</p>
            ) : (
              <div className="space-y-1">
                {structure.map((ch: any, i: number) => {
                  const chapKey = isID ? "bab" : "chapter";
                  const titKey = isID ? "judul" : "title";
                  const secKey = isID ? "subbab" : "sections";
                  const codeKey = isID ? "kode" : "code";
                  return (
                    <div key={i}>
                      <p className="text-sm font-medium">{isID ? `Bab ${ch[chapKey]}` : `Chapter ${ch[chapKey]}`}: {ch[titKey]}</p>
                      {(ch[secKey] || []).map((sec: any) => (
                        <p key={sec[codeKey]} className="text-xs text-muted-foreground ml-4">
                          {sec[codeKey]}. {isID ? sec.judul : sec.title}
                        </p>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ---- PREVIEW VIEW ----
  if (selectedBook && showPreview) {
    const isID = selectedBook.lang === "id";
    const structure = (selectedBook.structure as any[]) || [];
    const content = (selectedBook.content as Record<string, string>) || {};
    const chap = structure[previewChapter];
    const chapKey = isID ? "bab" : "chapter";
    const titKey = isID ? "judul" : "title";
    const secKey = isID ? "subbab" : "sections";
    const codeKey = isID ? "kode" : "code";
    const secTitKey = isID ? "judul" : "title";
    const sections = chap?.[secKey] || [];

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-20">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Details
          </Button>
          <Button size="sm" variant="outline" onClick={() => exportToDocx(selectedBook)} className="ml-auto">
            <Download className="w-4 h-4 mr-1" /> Export
          </Button>
        </div>
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
                      <p className="text-sm text-muted-foreground italic">[Not generated]</p>
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

  // ---- LIST VIEW ----
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("library.title")}</h1>
        <Button size="sm" onClick={() => navigate("/generate")}>
          <BookOpen className="w-4 h-4 mr-2" /> Generate
        </Button>
      </div>

      {!user && guestBooks.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <h3 className="font-medium mb-1">{t("library.emptyTitle")}</h3>
            <p className="text-sm text-muted-foreground">{t("library.emptyDesc")}</p>
            <Button className="mt-4" onClick={() => navigate("/generate")}>Generate your first book</Button>
          </CardContent>
        </Card>
      )}

      {isLoading && user && <div className="text-center py-8 text-muted-foreground">{t("common.loading")}</div>}

      {allBooks.length > 0 && (
        <div className="space-y-2">
          {allBooks.map((book) => (
            <Card key={`${(book as any).isGuest ? "g" : "c"}_${book.id}`}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => setSearchParams({ book: String(book.id) })}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <BookText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{book.topic}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{book.pageCount || 0} pages</span>
                    <span>•</span>
                    <span>{new Date(book.createdAt).toLocaleDateString()}</span>
                    {(book as any).isGuest && <Badge variant="outline" className="text-[10px] py-0">Local</Badge>}
                  </div>
                </div>
                <Badge variant={book.status === "completed" ? "default" : book.status === "interrupted" ? "outline" : "secondary"} className="shrink-0">
                  {book.status === "interrupted" ? "⚠ partial" : book.status}
                </Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0"
                  onClick={(e) => { e.stopPropagation(); setDeleteId(book.id); setDeleteIsGuest(!!(book as any).isGuest); }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("library.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
