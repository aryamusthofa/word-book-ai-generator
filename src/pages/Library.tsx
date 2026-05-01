import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { exportToDocx } from "@/lib/docx-export";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  BookText,
  Download,
  Trash2,
  BookOpen,
  ChevronLeft,
  FileText,
  Calendar,
  Cpu,
} from "lucide-react";
import { motion } from "framer-motion";

export default function LibraryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: books, isLoading } = trpc.books.list.useQuery(undefined, { enabled: !!user });
  const deleteBook = trpc.books.delete.useMutation();
  const utils = trpc.useUtils();

  const selectedBookId = searchParams.get("book");
  const selectedBook = books?.find((b) => b.id === Number(selectedBookId));

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteBook.mutateAsync({ id: deleteId });
    utils.books.list.invalidate();
    setDeleteId(null);
    if (selectedBookId === String(deleteId)) {
      setSearchParams({});
    }
  };

  if (selectedBook) {
    const isID = selectedBook.lang === "id";
    const structure = (selectedBook.structure as any[]) || [];
    const content = (selectedBook.content as Record<string, string>) || {};

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSearchParams({})}>
            <ChevronLeft className="w-4 h-4 mr-1" /> {t("common.back")}
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <h1 className="text-xl font-bold mb-2">{selectedBook.topic}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline"><FileText className="w-3 h-3 mr-1" />{selectedBook.pageCount} {t("library.pages")}</Badge>
              <Badge variant="outline"><Calendar className="w-3 h-3 mr-1" />{new Date(selectedBook.createdAt).toLocaleDateString()}</Badge>
              {selectedBook.providerUsed && (
                <Badge variant="outline"><Cpu className="w-3 h-3 mr-1" />{selectedBook.providerUsed}</Badge>
              )}
            </div>
            <div className="flex gap-2 mb-6">
              <Button onClick={() => exportToDocx(selectedBook)}>
                <Download className="w-4 h-4 mr-2" />
                {t("library.download")} .docx
              </Button>
              <Button variant="destructive" onClick={() => setDeleteId(selectedBook.id)}>
                <Trash2 className="w-4 h-4 mr-2" />
                {t("library.delete")}
              </Button>
            </div>

            <div className="space-y-6">
              {structure.map((ch: any) => {
                const chapKey = isID ? "bab" : "chapter";
                const titKey = isID ? "judul" : "title";
                const secKey = isID ? "subbab" : "sections";
                const codeKey = isID ? "kode" : "code";
                const secTitKey = isID ? "judul" : "title";

                return (
                  <div key={ch[chapKey]} className="border-l-2 border-primary/30 pl-4">
                    <h2 className="text-lg font-bold text-primary mb-3">
                      {isID ? `Bab ${ch[chapKey]}` : `Chapter ${ch[chapKey]}`}: {ch[titKey]}
                    </h2>
                    <div className="space-y-4">
                      {(ch[secKey] || []).map((sec: any) => {
                        const sectionId = `${ch[chapKey]}_${sec[codeKey]}`;
                        return (
                          <div key={sectionId}>
                            <h3 className="font-medium mb-2">
                              {sec[codeKey]}. {sec[secTitKey]}
                            </h3>
                            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                              {content[sectionId] || "No content generated."}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("library.title")}</h1>
        <Button size="sm" onClick={() => navigate("/generate")}>
          <BookOpen className="w-4 h-4 mr-2" />
          {t("nav.generate")}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">{t("common.loading")}</div>
      ) : !books || books.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <h3 className="font-medium mb-1">{t("library.emptyTitle")}</h3>
            <p className="text-sm text-muted-foreground">{t("library.emptyDesc")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {books.map((book) => (
            <Card
              key={book.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => setSearchParams({ book: String(book.id) })}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{book.topic}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{book.pageCount} {t("library.pages")}</span>
                    <span>•</span>
                    <span>{new Date(book.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <Badge variant={book.status === "completed" ? "default" : "secondary"}>
                  {book.status}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(book.id);
                  }}
                >
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
            <AlertDialogDescription>{t("library.confirmDelete")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
