import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Crown,
  Check,
  CreditCard,
  Smartphone,
  QrCode,
  ArrowLeft,
  Loader2,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

export default function PremiumPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: plans } = trpc.payments.plans.useQuery();
  const createIntent = trpc.payments.createIntent.useMutation();
  const verifyPayment = trpc.payments.verify.useMutation();

  const [selectedMethod, setSelectedMethod] = useState("credit_card");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpgrade = async () => {
    setProcessing(true);
    try {
      const intent = await createIntent.mutateAsync({
        amount: 99000,
        method: selectedMethod as any,
        currency: "IDR",
      });
      // Mock verification
      await new Promise((r) => setTimeout(r, 2000));
      await verifyPayment.mutateAsync({ externalId: intent.externalId });
      setSuccess(true);
    } catch {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Crown className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{t("premium.success")}</h2>
        <p className="text-muted-foreground mb-6">You now have unlimited access to all features.</p>
        <Button onClick={() => navigate("/")}>Go to Home</Button>
      </motion.div>
    );
  }

  const premiumPlan = plans?.find((p) => p.id === "premium");

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>

      <div className="text-center">
        <Crown className="w-12 h-12 mx-auto mb-3 text-amber-500" />
        <h1 className="text-2xl font-bold">{t("premium.title")}</h1>
        <p className="text-muted-foreground">{t("premium.subtitle")}</p>
      </div>

      {premiumPlan && (
        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-amber-500/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                {premiumPlan.name}
              </CardTitle>
              <Badge variant="secondary">{t("premium.price", { price: premiumPlan.price })}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {premiumPlan.features.map((feature: string, i: number) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("premium.paymentMethods")}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod} className="space-y-3">
            <div className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-accent">
              <RadioGroupItem value="credit_card" id="cc" />
              <Label htmlFor="cc" className="flex items-center gap-2 cursor-pointer flex-1">
                <CreditCard className="w-4 h-4" />
                {t("premium.creditCard")}
              </Label>
            </div>
            <div className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-accent">
              <RadioGroupItem value="e_wallet" id="ew" />
              <Label htmlFor="ew" className="flex items-center gap-2 cursor-pointer flex-1">
                <Smartphone className="w-4 h-4" />
                {t("premium.eWallet")}
              </Label>
            </div>
            <div className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-accent">
              <RadioGroupItem value="qris" id="qris" />
              <Label htmlFor="qris" className="flex items-center gap-2 cursor-pointer flex-1">
                <QrCode className="w-4 h-4" />
                {t("premium.qris")}
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Button className="w-full" size="lg" onClick={handleUpgrade} disabled={processing}>
        {processing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {t("premium.processing")}
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            {t("premium.upgradeBtn")}
          </>
        )}
      </Button>
    </motion.div>
  );
}
