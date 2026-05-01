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
import {
  Send,
  BookOpen,
  MessageSquare,
  Plus,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { apiKeys, selectedModel } = useAppStore();
  const [sessionId] = useState(() => `chat_${Date.now()}`);
  const [messages, setMessages] = useState<{ role: string; content: string; topicDetected?: string }[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addMessage = trpc.chat.addMessage.useMutation();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || !Object.values(apiKeys).some((k) => k)) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    if (user) {
      await addMessage.mutateAsync({ sessionId, role: "user", content: input });
    }

    try {
      const systemPrompt = `You are a helpful book brainstorming assistant. Help users refine their book ideas, suggest topics, and guide them toward a clear book concept. Keep responses concise and actionable. If the user describes a clear book topic, acknowledge it and offer to generate the book.`;
      
      const response = await callAI({
        messages: [
          ...messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: input },
        ],
        systemPrompt,
        maxTokens: 800,
        selectedModel,
        apiKeys,
      });

      const topicDetected = response.toLowerCase().includes("generate") || response.toLowerCase().includes("book");
      const assistantMsg = { role: "assistant", content: response, topicDetected: topicDetected ? input : undefined };
      setMessages((prev) => [...prev, assistantMsg]);

      if (user) {
        await addMessage.mutateAsync({ sessionId, role: "assistant", content: response, topicDetected: topicDetected ? input : undefined });
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: t("common.error") }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  };

  const handleGenerate = (topic: string) => {
    navigate("/generate", { state: { topic } });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-4rem)] lg:h-[calc(100vh-2rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">{t("nav.chat")}</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={handleNewChat}>
          <Plus className="w-4 h-4 mr-1" />
          {t("chat.newChat")}
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
        <div className="space-y-4 pb-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <h3 className="font-medium mb-1">{t("chat.emptyTitle")}</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">{t("chat.emptyDesc")}</p>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <Card className={`max-w-[85%] ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-accent"}`}>
                    <CardContent className="p-3 text-sm">
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      {msg.topicDetected && (
                        <Button
                          size="sm"
                          variant={msg.role === "user" ? "secondary" : "default"}
                          className="mt-2"
                          onClick={() => handleGenerate(msg.topicDetected!)}
                        >
                          <BookOpen className="w-3 h-3 mr-1" />
                          {t("chat.useTopic")}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <Card className="bg-accent">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("common.loading")}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="pt-4 border-t">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("chat.placeholder")}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!input.trim() || isTyping || !Object.values(apiKeys).some((k) => k)}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
        {!Object.values(apiKeys).some((k) => k) && (
          <p className="text-xs text-muted-foreground mt-2 text-center">{t("common.noKey")}</p>
        )}
      </div>
    </motion.div>
  );
}
