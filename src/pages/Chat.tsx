import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { callAI } from "@/lib/ai-service";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Send, BookOpen, MessageSquare, Plus, Loader2, AlertTriangle, ChevronLeft, Trash2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: string;
  content: string;
  topicDetected?: string;
  error?: boolean;
}

const SESSION_STORAGE_KEY = "wordai-chat-session";
const LOCAL_HISTORY_KEY = "wordai-chat-local-history";

function getPersistedMessages(): Message[] {
  try { return JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveMessages(msgs: Message[]) {
  try { sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(msgs)); } catch {}
}

interface LocalSession { id: string; title: string; messages: Message[]; updatedAt: number; }
function getLocalSessions(): LocalSession[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY) || "[]"); } catch { return []; }
}
function saveLocalSessions(sessions: LocalSession[]) {
  try { localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(sessions)); } catch {}
}

export default function ChatPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { apiKeys, selectedModel } = useAppStore();

  const [sessionId] = useState(() => {
    // Persist session ID in sessionStorage so it survives re-renders but resets on new tab/close
    let id = sessionStorage.getItem("wordai-chat-session-id");
    if (!id) { id = `chat_${Date.now()}`; sessionStorage.setItem("wordai-chat-session-id", id); }
    return id;
  });

  const [messages, setMessages] = useState<Message[]>(getPersistedMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [localSessions, setLocalSessions] = useState<LocalSession[]>(getLocalSessions);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addMessage = trpc.chat.addMessage.useMutation();

  const hasApiKey = Object.values(apiKeys).some((v) =>
    Array.isArray(v) ? (v as any[]).length > 0 : !!v
  );

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    saveMessages(messages);
  }, [messages, isTyping]);

  const saveCurrentToLocal = (msgs: Message[]) => {
    if (msgs.length < 2) return;
    const title = msgs[0]?.content?.slice(0, 50) || "Chat";
    const sessions = getLocalSessions();
    const existingIdx = sessions.findIndex((s) => s.id === sessionId);
    const updated: LocalSession = { id: sessionId, title, messages: msgs, updatedAt: Date.now() };
    if (existingIdx >= 0) sessions[existingIdx] = updated; else sessions.unshift(updated);
    const trimmed = sessions.slice(0, 20); // keep last 20
    saveLocalSessions(trimmed);
    setLocalSessions(trimmed);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!hasApiKey) {
      setErrorMsg("No API key configured. Go to Settings to add one.");
      setShowErrorDialog(true);
      return;
    }

    const userMsg: Message = { role: "user", content: input };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setIsTyping(true);

    if (user) {
      addMessage.mutateAsync({ sessionId, role: "user", content: input }).catch(() => {});
    }

    try {
      const systemPrompt = `You are a helpful book brainstorming assistant. Help users refine their book ideas, suggest topics, and guide them toward a clear book concept. Keep responses concise, friendly, and actionable. When the user has a clear topic, let them know and suggest they head to the Generate page.`;
      const response = await callAI({
        messages: newMsgs.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        systemPrompt, maxTokens: 600, selectedModel, apiKeys,
      });

      const topicDetected = /let's generate|shall we generate|ready to generate|go to generate|create this book/i.test(response);
      const assistantMsg: Message = { role: "assistant", content: response, topicDetected: topicDetected ? input : undefined };
      const finalMsgs = [...newMsgs, assistantMsg];
      setMessages(finalMsgs);
      saveCurrentToLocal(finalMsgs);

      if (user) {
        addMessage.mutateAsync({ sessionId, role: "assistant", content: response, topicDetected: topicDetected ? input : undefined }).catch(() => {});
      }
    } catch (err: any) {
      const errMsg = err.message || t("common.error");
      const errorReply: Message = { role: "assistant", content: `Error: ${errMsg}`, error: true };
      const finalMsgs = [...newMsgs, errorReply];
      setMessages(finalMsgs);
      setErrorMsg(errMsg);
      setShowErrorDialog(true);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleNewChat = () => {
    saveCurrentToLocal(messages);
    setMessages([]);
    sessionStorage.setItem("wordai-chat-session-id", `chat_${Date.now()}`);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setInput("");
    inputRef.current?.focus();
  };

  const handleLoadSession = (session: LocalSession) => {
    saveCurrentToLocal(messages);
    setMessages(session.messages);
    saveMessages(session.messages);
    sessionStorage.setItem("wordai-chat-session-id", session.id);
    setShowHistory(false);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = localSessions.filter((s) => s.id !== id);
    saveLocalSessions(updated);
    setLocalSessions(updated);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-4rem)] lg:h-[calc(100vh-2rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h1 className="font-semibold">{t("nav.chat")}</h1>
          {messages.length > 0 && <Badge variant="secondary" className="text-xs">{messages.length} msgs</Badge>}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowHistory(true)}>
            <Clock className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleNewChat}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef as any}>
        <div className="py-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">Brainstorm book ideas with AI</p>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {["Suggest a book topic about technology", "Help me write a book about health", "What's a good book topic for students?"].map((s) => (
                  <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }} className="text-xs border rounded-full px-3 py-1 hover:bg-muted transition-colors">
                    {s}
                  </button>
                ))}
              </div>
              {!hasApiKey && (
                <div className="mt-6 text-xs text-muted-foreground">
                  <AlertTriangle className="w-4 h-4 inline mr-1 text-yellow-500" />
                  No API key configured.{" "}
                  <button className="text-primary underline" onClick={() => navigate("/settings")}>Add one in Settings</button>
                </div>
              )}
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : msg.error
                    ? "bg-destructive/10 text-destructive border border-destructive/30 rounded-tl-sm"
                    : "bg-muted rounded-tl-sm"
                }`}>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  {msg.topicDetected && (
                    <Button
                      size="sm"
                      className="mt-2 h-7 text-xs"
                      onClick={() => navigate("/generate", { state: { topic: msg.topicDetected } })}
                    >
                      <BookOpen className="w-3 h-3 mr-1" /> Generate this book
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  {[0,1,2].map((i) => (
                    <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
                      animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t px-4 py-3 shrink-0">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasApiKey ? "Type your idea..." : "Add API key in Settings first"}
            disabled={isTyping || !hasApiKey}
            className="flex-1"
          />
          <Button size="icon" onClick={handleSend} disabled={isTyping || !input.trim() || !hasApiKey}>
            {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-sm max-h-[70vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Clock className="w-4 h-4" /> Chat History</DialogTitle>
            <DialogDescription>Your recent brainstorming sessions</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-64">
            {localSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No saved sessions yet</p>
            ) : (
              <div className="space-y-2">
                {localSessions.map((session) => (
                  <button key={session.id} onClick={() => handleLoadSession(session)}
                    className="w-full text-left border rounded-lg p-3 hover:bg-muted/50 transition-colors flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{session.title}</p>
                      <p className="text-xs text-muted-foreground">{session.messages.length} messages · {formatTime(session.updatedAt)}</p>
                    </div>
                    <button onClick={(e) => handleDeleteSession(session.id, e)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-5 h-5" /> Request Failed</DialogTitle>
          </DialogHeader>
          <div className="bg-muted/50 rounded-md p-3 text-xs font-mono text-muted-foreground">
            {errorMsg}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => navigate("/settings")}>Go to Settings</Button>
            <Button variant="outline" onClick={() => setShowErrorDialog(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
