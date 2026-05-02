import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/store/useAppStore";
import { PROVIDERS, validateApiKey } from "@/lib/ai-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Key, Plus, Check, X, Trash2, User, Palette, Cpu, Loader2, Eye, EyeOff, ChevronDown, Zap, Shield, Sparkles, Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PROVIDER_ICONS: Record<string, string> = {
  openai: "🟢", gemini: "🔵", groq: "⚡", perplexity: "🔍", deepseek: "🐋",
  anthropic: "🟤", cohere: "🔶", mistral: "💫", xai: "𝕏", together: "🤝",
  openrouter: "🌐", cerebras: "🧠", fireworks: "🔥", novita: "✨",
};

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const {
    theme, setTheme, appLang, setAppLang, apiKeys, addApiKey, removeApiKey,
    updateApiKeyLabel, selectedModel, setSelectedModel, settings, updateSetting,
  } = useAppStore();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showModelDialog, setShowModelDialog] = useState(false);
  const [newProvider, setNewProvider] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [validating, setValidating] = useState<Record<string, boolean>>({});
  const [keyStatus, setKeyStatus] = useState<Record<string, "valid" | "invalid">>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [editLabel, setEditLabel] = useState<string | null>(null);
  const [editLabelValue, setEditLabelValue] = useState("");

  const allProviders = Object.entries(PROVIDERS);
  const hasAnyKey = Object.values(apiKeys).some((arr) => Array.isArray(arr) ? arr.length > 0 : !!arr);

  const handleValidate = async (provider: string, keyId: string, keyVal: string) => {
    const vKey = `${provider}:${keyId}`;
    setValidating((v) => ({ ...v, [vKey]: true }));
    const valid = await validateApiKey(provider, keyVal);
    setKeyStatus((v) => ({ ...v, [vKey]: valid ? "valid" : "invalid" }));
    setValidating((v) => ({ ...v, [vKey]: false }));
  };

  const handleAddKey = () => {
    if (!newProvider || !newKey) return;
    const existing = apiKeys[newProvider] || [];
    const label = newLabel || `Key ${(Array.isArray(existing) ? existing.length : 0) + 1}`;
    const id = addApiKey(newProvider, newKey, label);
    handleValidate(newProvider, id, newKey);
    setNewKey(""); setNewLabel(""); setNewProvider(""); setShowAddDialog(false);
  };

  // Model picker helpers
  const modelsByProvider = allProviders.map(([provKey, p]: [string, any]) => ({
    provKey,
    name: p.name,
    icon: PROVIDER_ICONS[provKey] || "🤖",
    models: p.models,
    hasKey: Array.isArray(apiKeys[provKey]) ? (apiKeys[provKey] as any[]).length > 0 : !!apiKeys[provKey],
  }));

  const selectedProviderKey = selectedModel?.split(":")?.[0] ?? "auto";
  const selectedModelId = selectedModel?.includes(":") ? selectedModel.slice(selectedModel.indexOf(":") + 1) : "";
  const selectedProviderName = (PROVIDERS as any)[selectedProviderKey]?.name ?? "";
  const selectedModelName = (PROVIDERS as any)[selectedProviderKey]?.models?.find((m: any) => m.id === selectedModelId)?.name ?? "";

  const TAG_COLORS: Record<string, string> = {
    fast: "bg-emerald-500/20 text-emerald-400",
    smart: "bg-blue-500/20 text-blue-400",
    powerful: "bg-violet-500/20 text-violet-400",
  };

  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-xl font-bold">{t("settings.title")}</h1>

      {/* === API KEYS === */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="w-4 h-4" />
            {t("settings.apiSection")}
          </CardTitle>
          <p className="text-xs text-muted-foreground">Stored locally on device only. Never sent to cloud.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {allProviders.map(([provKey, p]: [string, any]) => {
            const entries = Array.isArray(apiKeys[provKey]) ? (apiKeys[provKey] as any[]) : [];
            if (entries.length === 0) return null;
            return (
              <div key={provKey} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{PROVIDER_ICONS[provKey] || "🤖"}</span>
                  <span className="font-medium text-sm">{p.name}</span>
                  <Badge variant="outline" className="text-xs ml-auto">{entries.length} key{entries.length > 1 ? "s" : ""}</Badge>
                </div>
                {entries.map((entry: any) => {
                  const vKey = `${provKey}:${entry.id}`;
                  const isVisible = showKeys[vKey];
                  return (
                    <div key={entry.id} className="flex items-center gap-2 bg-muted/30 rounded-md p-2">
                      <div className="flex-1 min-w-0">
                        {editLabel === vKey ? (
                          <Input
                            value={editLabelValue}
                            onChange={(e) => setEditLabelValue(e.target.value)}
                            onBlur={() => { updateApiKeyLabel(provKey, entry.id, editLabelValue); setEditLabel(null); }}
                            onKeyDown={(e) => { if (e.key === "Enter") { updateApiKeyLabel(provKey, entry.id, editLabelValue); setEditLabel(null); } }}
                            className="h-6 text-xs mb-1"
                            autoFocus
                          />
                        ) : (
                          <button
                            className="text-xs text-muted-foreground hover:text-foreground mb-1 text-left"
                            onClick={() => { setEditLabel(vKey); setEditLabelValue(entry.label); }}
                          >
                            {entry.label} ✎
                          </button>
                        )}
                        <div className="flex items-center gap-1">
                          <code className="text-xs font-mono truncate">
                            {isVisible ? entry.key : entry.key.slice(0, 8) + "••••••••"}
                          </code>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setShowKeys((s) => ({ ...s, [vKey]: !isVisible }))}>
                        {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleValidate(provKey, entry.id, entry.key)} disabled={validating[vKey]}>
                        {validating[vKey] ? <Loader2 className="w-3 h-3 animate-spin" /> :
                          keyStatus[vKey] === "valid" ? <Check className="w-3 h-3 text-green-500" /> :
                          keyStatus[vKey] === "invalid" ? <X className="w-3 h-3 text-red-500" /> :
                          <Sparkles className="w-3 h-3" />}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => removeApiKey(provKey, entry.id)}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {!hasAnyKey && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No API keys added yet. Add a key to start generating books.
            </div>
          )}

          <Button variant="outline" className="w-full" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t("settings.addKey")}
          </Button>
        </CardContent>
      </Card>

      {/* === MODEL PICKER === */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            {t("settings.modelSection")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <button
            onClick={() => setShowModelDialog(true)}
            className="w-full border rounded-lg p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
          >
            {selectedModel === "auto:auto" ? (
              <>
                <Zap className="w-5 h-5 text-yellow-500" />
                <div className="flex-1">
                  <div className="font-medium text-sm">Auto (Smart Fallback)</div>
                  <div className="text-xs text-muted-foreground">Tries best available model automatically</div>
                </div>
              </>
            ) : (
              <>
                <span className="text-xl">{PROVIDER_ICONS[selectedProviderKey] || "🤖"}</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">{selectedModelName}</div>
                  <div className="text-xs text-muted-foreground">{selectedProviderName}</div>
                </div>
              </>
            )}
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        </CardContent>
      </Card>

      {/* === PERSONALIZATION === */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" />
            {t("settings.personaSection")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{t("settings.authorName")}</Label>
            <Input value={settings.authorName} onChange={(e) => updateSetting("authorName", e.target.value)} placeholder="Your name" className="mt-1" />
          </div>
          <div>
            <Label>{t("settings.defaultLang")}</Label>
            <Select value={settings.bookLang} onValueChange={(v) => updateSetting("bookLang", v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[["en","English"],["id","Bahasa Indonesia"],["es","Español"],["fr","Français"],["de","Deutsch"],["ja","日本語"],["ko","한국어"],["pt","Português"],["ar","العربية"],["zh","中文"],["hi","हिन्दी"],["ru","Русский"]].map(([v,l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* === APP SETTINGS === */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="w-4 h-4" />
            {t("settings.appSection")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{t("settings.theme")}</Label>
            <div className="flex gap-2 mt-2">
              {(["light","dark","system"] as const).map((th) => (
                <Button key={th} variant={theme === th ? "default" : "outline"} size="sm" onClick={() => setTheme(th)} className="flex-1 capitalize">
                  {th === "light" ? "☀️" : th === "dark" ? "🌙" : "💻"} {t(`settings.theme${th.charAt(0).toUpperCase()+th.slice(1)}`)}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label className="flex items-center gap-2"><Globe className="w-3 h-3" />{t("settings.language")}</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                { code: "en", flag: "🇺🇸", label: "EN" }, { code: "id", flag: "🇮🇩", label: "ID" },
                { code: "es", flag: "🇪🇸", label: "ES" }, { code: "fr", flag: "🇫🇷", label: "FR" },
                { code: "de", flag: "🇩🇪", label: "DE" }, { code: "ja", flag: "🇯🇵", label: "JA" },
                { code: "ko", flag: "🇰🇷", label: "KO" }, { code: "pt", flag: "🇧🇷", label: "PT" },
                { code: "ar", flag: "🇸🇦", label: "AR" }, { code: "zh", flag: "🇨🇳", label: "ZH" },
                { code: "hi", flag: "🇮🇳", label: "HI" }, { code: "ru", flag: "🇷🇺", label: "RU" },
              ].map((lang) => (
                <Badge
                  key={lang.code}
                  variant={appLang === lang.code ? "default" : "outline"}
                  className="cursor-pointer text-sm py-1 px-2"
                  onClick={() => { setAppLang(lang.code); i18n.changeLanguage(lang.code); }}
                >
                  {lang.flag} {lang.label}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* === ADD KEY DIALOG === */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Key className="w-4 h-4" /> Add API Key</DialogTitle>
            <DialogDescription>Keys are stored only on this device.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Provider</Label>
              <Select value={newProvider} onValueChange={setNewProvider}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select provider" /></SelectTrigger>
                <SelectContent>
                  {allProviders.map(([key, p]: [string, any]) => (
                    <SelectItem key={key} value={key}>
                      {PROVIDER_ICONS[key] || "🤖"} {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Label (optional)</Label>
              <Input className="mt-1" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="e.g. Main Key, Backup Key" />
            </div>
            <div>
              <Label>API Key</Label>
              <Input className="mt-1" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="Enter API key" type="password" />
            </div>
            {newProvider && (
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2 flex items-center gap-2">
                <Shield className="w-3 h-3" />
                Get key from: {
                  { openai: "platform.openai.com", gemini: "aistudio.google.com", groq: "console.groq.com",
                    perplexity: "perplexity.ai/settings/api", deepseek: "platform.deepseek.com",
                    anthropic: "console.anthropic.com", cohere: "dashboard.cohere.com", mistral: "console.mistral.ai",
                    xai: "console.x.ai", together: "api.together.xyz", openrouter: "openrouter.ai/keys",
                    cerebras: "cloud.cerebras.ai", fireworks: "fireworks.ai/account/api-keys", novita: "novita.ai/settings",
                  }[newProvider] || "provider website"
                }
              </div>
            )}
            <Button className="w-full" onClick={handleAddKey} disabled={!newProvider || !newKey}>
              <Plus className="w-4 h-4 mr-2" /> Add Key
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* === MODEL PICKER DIALOG === */}
      <Dialog open={showModelDialog} onOpenChange={setShowModelDialog}>
        <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Cpu className="w-4 h-4" /> Select AI Model</DialogTitle>
            <DialogDescription>Models from providers with API keys are shown first.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {/* Auto option */}
            <button
              className={`w-full text-left border rounded-lg p-3 flex items-center gap-3 transition-colors ${selectedModel === "auto:auto" ? "border-primary bg-primary/10" : "hover:bg-muted/50"}`}
              onClick={() => { setSelectedModel("auto:auto"); setShowModelDialog(false); }}
            >
              <Zap className="w-5 h-5 text-yellow-500" />
              <div>
                <div className="font-medium text-sm">Auto (Smart Fallback)</div>
                <div className="text-xs text-muted-foreground">Tries best model automatically</div>
              </div>
              {selectedModel === "auto:auto" && <Check className="w-4 h-4 text-primary ml-auto" />}
            </button>

            {/* Per-provider groups */}
            {modelsByProvider.map(({ provKey, name, icon, models, hasKey }) => (
              <div key={provKey} className={`border rounded-lg overflow-hidden ${!hasKey ? "opacity-50" : ""}`}>
                <div className="px-3 py-2 bg-muted/30 flex items-center gap-2">
                  <span>{icon}</span>
                  <span className="font-medium text-sm">{name}</span>
                  {!hasKey && <Badge variant="outline" className="ml-auto text-xs">No Key</Badge>}
                </div>
                {hasKey && models.map((m: any) => {
                  const mId = `${provKey}:${m.id}`;
                  const isSelected = selectedModel === mId;
                  return (
                    <button
                      key={m.id}
                      className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-muted/50 transition-colors ${isSelected ? "bg-primary/10" : ""}`}
                      onClick={() => { setSelectedModel(mId); setShowModelDialog(false); }}
                    >
                      <div className="flex-1">
                        <span className="text-sm">{m.name}</span>
                      </div>
                      <Badge className={`text-xs ${TAG_COLORS[m.tag] || ""}`} variant="secondary">{m.tag}</Badge>
                      {isSelected && <Check className="w-3 h-3 text-primary" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
