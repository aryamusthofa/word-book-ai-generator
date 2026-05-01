import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/store/useAppStore";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Loader2,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") === "register" ? "register" : "login";
  const { setGuestId } = useAppStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();
  const createGuest = trpc.auth.createGuest.useMutation();

  const handleLogin = async () => {
    setError("");
    try {
      await loginMutation.mutateAsync({ email, password });
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message || t("common.error"));
    }
  };

  const handleRegister = async () => {
    setError("");
    try {
      await registerMutation.mutateAsync({ email, password, name });
      await loginMutation.mutateAsync({ email, password });
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message || t("common.error"));
    }
  };

  const handleGuest = async () => {
    try {
      const res = await createGuest.mutateAsync();
      setGuestId(res.guestId);
      window.location.href = "/";
    } catch {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm w-full">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/welcome")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>

        <Tabs defaultValue={defaultTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">{t("auth.loginBtn")}</TabsTrigger>
            <TabsTrigger value="register">{t("auth.registerBtn")}</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>{t("auth.loginTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div>
                  <Label>{t("auth.email")}</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label>{t("auth.password")}</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                  />
                </div>
                <Button className="w-full" onClick={handleLogin} disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t("auth.loginBtn")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>{t("auth.registerTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div>
                  <Label>{t("auth.name")}</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label>{t("auth.email")}</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label>{t("auth.password")}</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                  />
                </div>
                <Button className="w-full" onClick={handleRegister} disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t("auth.registerBtn")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-4">
          <Button variant="ghost" className="w-full" onClick={handleGuest} disabled={createGuest.isPending}>
            <Zap className="w-4 h-4 mr-2" />
            {t("auth.guest")}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
