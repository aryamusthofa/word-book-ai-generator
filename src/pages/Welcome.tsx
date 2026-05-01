import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/store/useAppStore";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Zap, Globe, Shield, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function WelcomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setGuestId } = useAppStore();
  const createGuest = trpc.auth.createGuest.useMutation();

  const handleGuest = async () => {
    try {
      const res = await createGuest.mutateAsync();
      setGuestId(res.guestId);
      navigate("/");
    } catch {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{t("welcome.title")}</h1>
          <p className="text-muted-foreground">{t("welcome.subtitle")}</p>
        </div>

        <Card className="mb-4">
          <CardContent className="p-6 space-y-3">
            <Button className="w-full" size="lg" onClick={() => navigate("/login")}>
              <Sparkles className="w-4 h-4 mr-2" />
              {t("auth.loginBtn")}
            </Button>
            <Button variant="outline" className="w-full" size="lg" onClick={() => navigate("/register")}>
              {t("auth.registerBtn")}
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">{t("welcome.or")}</span>
              </div>
            </div>
            <Button
              variant="secondary"
              className="w-full"
              size="lg"
              onClick={handleGuest}
              disabled={createGuest.isPending}
            >
              <Zap className="w-4 h-4 mr-2" />
              {t("welcome.guestBtn")}
            </Button>
            <p className="text-xs text-muted-foreground text-center">{t("welcome.guestNotice")}</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-accent/50">
            <Globe className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">9 Languages</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-accent/50">
            <Sparkles className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">10+ AI Models</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-accent/50">
            <Shield className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">No Ads</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
