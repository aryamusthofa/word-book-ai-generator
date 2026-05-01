import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/store/useAppStore";
import { PROVIDERS, validateApiKey } from "@/lib/ai-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Key,
  Plus,
  Check,
  X,
  Trash2,
  User,
  Palette,
  Sparkles,
  Cpu,
  Loader2,
} from "lucide-react";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme, appLang, setAppLang, apiKeys, setApiKey, removeApiKey, selectedModel, setSelectedModel, settings, updateSetting } = useAppStore();

  const [newProvider, setNewProvider] = useState("");
  const [newKey, setNewKey] = useState("");
  const [validating, setValidating] = useState<Record<string, boolean>>({});
  const [keyStatus, setKeyStatus] = useState<Record<string, "valid" | "invalid" | "">>({});
  const [showAddDialog, setShowAddDialog] = useState(false);

  const allProviders = Object.entries(PROVIDERS);

  const handleValidate = async (provider: string, key: string) => {
    setValidating({ ...validating, [provider]: true });
    const valid = await validateApiKey(provider, key);
    setKeyStatus({ ...keyStatus, [provider]: valid ? "valid" : "invalid" });
    setValidating({ ...validating, [provider]: false });
  };

  const handleAddKey = () => {
    if (newProvider && newKey) {
      setApiKey(newProvider, newKey);
      handleValidate(newProvider, newKey);
      setNewKey("");
      setNewProvider("");
      setShowAddDialog(false);
    }
  };

  const handleRemoveKey = (provider: string) => {
    removeApiKey(provider);
    const { [provider]: _, ...rest } = keyStatus;
    setKeyStatus(rest);
  };

  const availableModels = [
    { id: "auto:auto", name: t("models.auto") },
    ...allProviders.flatMap(([key, p]) =>
      apiKeys[key] ? p.models.map((m: any) => ({ id: `${key}:${m.id}`, name: `${p.name} · ${m.name}` })) : []
    ),
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">{t("settings.title")}</h1>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="w-4 h-4" />
            {t("settings.apiSection")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(apiKeys).map(([provider, key]) => (
            <div key={provider} className="flex items-center gap-2">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">{(PROVIDERS as any)[provider]?.name || provider}</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input value={key} type="password" readOnly className="flex-1 text-sm" />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleValidate(provider, key)}
                    disabled={validating[provider]}
                  >
                    {validating[provider] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : keyStatus[provider] === "valid" ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : keyStatus[provider] === "invalid" ? (
                      <X className="w-4 h-4 text-red-500" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleRemoveKey(provider)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                {t("settings.addKey")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("settings.addKey")}</DialogTitle>
                <DialogDescription>Add a new AI provider API key</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Provider</Label>
                  <Select value={newProvider} onValueChange={setNewProvider}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {allProviders.map(([key, p]: [string, any]) => (
                        <SelectItem key={key} value={key}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>API Key</Label>
                  <Input
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="Enter your API key"
                    type="password"
                  />
                </div>
                <Button className="w-full" onClick={handleAddKey} disabled={!newProvider || !newKey}>
                  {t("common.save")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Model Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            {t("settings.modelSection")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {availableModels.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Personalization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" />
            {t("settings.personaSection")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{t("settings.authorName")}</Label>
            <Input
              value={settings.authorName}
              onChange={(e) => updateSetting("authorName", e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div>
            <Label>{t("settings.defaultLang")}</Label>
            <Select value={settings.bookLang} onValueChange={(v) => updateSetting("bookLang", v)}>
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
        </CardContent>
      </Card>

      {/* App Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="w-4 h-4" />
            {t("settings.appSection")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{t("settings.theme")}</Label>
            <div className="flex gap-2 mt-2">
              <Button variant={theme === "light" ? "default" : "outline"} size="sm" onClick={() => setTheme("light")}>
                {t("settings.themeLight")}
              </Button>
              <Button variant={theme === "dark" ? "default" : "outline"} size="sm" onClick={() => setTheme("dark")}>
                {t("settings.themeDark")}
              </Button>
              <Button variant={theme === "system" ? "default" : "outline"} size="sm" onClick={() => setTheme("system")}>
                {t("settings.themeSystem")}
              </Button>
            </div>
          </div>
          <div>
            <Label>{t("settings.language")}</Label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {[
                { code: "en", label: "English" },
                { code: "id", label: "Indonesia" },
                { code: "es", label: "Español" },
                { code: "fr", label: "Français" },
                { code: "de", label: "Deutsch" },
                { code: "ja", label: "日本語" },
                { code: "ko", label: "한국어" },
                { code: "pt", label: "Português" },
                { code: "ar", label: "العربية" },
              ].map((lang) => (
                <Badge
                  key={lang.code}
                  variant={appLang === lang.code ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    setAppLang(lang.code);
                    i18n.changeLanguage(lang.code);
                  }}
                >
                  {lang.label}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
