import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Crown, Check, CreditCard, Smartphone, QrCode, ArrowLeft,
  Loader2, Sparkles, Zap, Shield, Infinity, BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PLANS = [
  { id: "daily",    label: "Daily",   price: 2000,   period: "/day",   idr: "Rp 2.000",   desc: "Try it out" },
  { id: "weekly",   label: "Weekly",  price: 12000,  period: "/week",  idr: "Rp 12.000",  desc: "Short projects" },
  { id: "monthly",  label: "Monthly", price: 30000,  period: "/month", idr: "Rp 30.000",  desc: "Most popular", badge: "Popular" },
  { id: "yearly",   label: "Yearly",  price: 150000, period: "/year",  idr: "Rp 150.000", desc: "Best value", badge: "Best Value" },
  { id: "lifetime", label: "Lifetime",price: 235000, period: " once",  idr: "Rp 235.000", desc: "Pay once, forever", badge: "Forever" },
];

const FEATURES = [
  { icon: Infinity, text: "Unlimited book generation" },
  { icon: Sparkles, text: "All AI models (including premium-only)" },
  { icon: BookOpen, text: "Cloud book storage & sync" },
  { icon: Shield,   text: "No ads, ever" },
  { icon: Zap,      text: "Priority processing" },
];

const PAYMENT_METHODS = [
  { id: "credit_card", label: "Credit / Debit Card", icon: CreditCard, detail: "Visa, Mastercard, JCB" },
  { id: "google_pay",  label: "Google Pay",          icon: Smartphone, detail: "Fast & secure" },
  { id: "dana",        label: "DANA",                icon: Smartphone, detail: "E-Wallet" },
  { id: "ovo",         label: "OVO",                 icon: Smartphone, detail: "E-Wallet" },
  { id: "gopay",       label: "GoPay",               icon: Smartphone, detail: "E-Wallet" },
  { id: "qris",        label: "QRIS",                icon: QrCode,     detail: "Scan & pay" },
];

export default function PremiumPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const createIntent = trpc.payments.createIntent.useMutation();
  const verifyPayment = trpc.payments.verify.useMutation();

  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const [selectedMethod, setSelectedMethod] = useState("credit_card");
  const [processing, setProcessing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const plan = PLANS.find((p) => p.id === selectedPlan)!;

  const handleUpgrade = async () => {
    if (!user) { navigate("/login"); return; }
    setProcessing(true); setErrorMsg("");
    try {
      const intent = await createIntent.mutateAsync({
        amount: plan.price,
        method: selectedMethod as any,
        currency: "IDR",
      });
      // Simulate payment gateway
      await new Promise((r) => setTimeout(r, 2200));
      await verifyPayment.mutateAsync({ externalId: intent.externalId });
      setSuccess(true);
    } catch (e: any) {
      setErrorMsg(e.message || "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
      setShowConfirm(false);
    }
  };

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 max-w-sm mx-auto">
        <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Crown className="w-12 h-12 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Welcome to Premium! ✨</h2>
        <p className="text-muted-foreground mb-6">Unlimited books, all models, all features — unlocked.</p>
        <Button className="w-full" onClick={() => navigate("/generate")}>
          <Zap className="w-4 h-4 mr-2" /> Start Generating
        </Button>
        <Button variant="ghost" className="w-full mt-2" onClick={() => navigate("/")}>Go to Home</Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto space-y-5 pb-20">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>

      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Crown className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold">Word AI Premium</h1>
        <p className="text-muted-foreground text-sm mt-1">Unlock unlimited books & all AI models</p>
      </div>

      {/* Trial Banner */}
      <Card className="border-violet-500/30 bg-gradient-to-r from-violet-500/10 to-purple-500/10">
        <CardContent className="p-4 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-violet-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold">14-Day Free Trial</p>
            <p className="text-xs text-muted-foreground">Try premium free via Google Pay. Cancel anytime.</p>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardContent className="p-4 space-y-2.5">
          {FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-sm">{text}</span>
              <Check className="w-4 h-4 text-green-500 ml-auto shrink-0" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Plan Selector */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">Choose a plan</Label>
        <div className="grid grid-cols-1 gap-2">
          {PLANS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlan(p.id)}
              className={`w-full text-left border rounded-xl p-3.5 flex items-center gap-3 transition-all ${
                selectedPlan === p.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedPlan === p.id ? "border-primary" : "border-muted-foreground"}`}>
                {selectedPlan === p.id && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{p.label}</span>
                  {p.badge && <Badge variant="secondary" className="text-xs py-0">{p.badge}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="font-bold text-sm">{p.idr}</span>
                <span className="text-xs text-muted-foreground block">{p.period}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Payment Method */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">Payment method</Label>
        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_METHODS.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMethod(m.id)}
                className={`text-left border rounded-xl p-3 flex items-start gap-2 transition-all ${
                  selectedMethod === m.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"
                }`}
              >
                <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium leading-tight">{m.label}</p>
                  <p className="text-[10px] text-muted-foreground">{m.detail}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {errorMsg && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{errorMsg}</div>
      )}

      {/* CTA */}
      <Button className="w-full" size="lg" onClick={() => { if (!user) { navigate("/login"); return; } setShowConfirm(true); }}>
        <Crown className="w-4 h-4 mr-2" />
        {!user ? "Login to Upgrade" : `Upgrade — ${plan.idr}${plan.period}`}
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        Secure payment · Cancel anytime · No hidden fees
      </p>

      {/* Confirm Dialog */}
      <Dialog open={showConfirm} onOpenChange={(o) => { if (!processing) setShowConfirm(o); }}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Crown className="w-5 h-5 text-amber-500" /> Confirm Purchase</DialogTitle>
            <DialogDescription>You're about to activate Premium</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span className="font-medium">{plan.label}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-semibold">{plan.idr}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Method</span><span>{PAYMENT_METHODS.find((m) => m.id === selectedMethod)?.label}</span></div>
            </div>
            <Button className="w-full" onClick={handleUpgrade} disabled={processing}>
              {processing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : <>Pay {plan.idr}</>}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setShowConfirm(false)} disabled={processing}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
