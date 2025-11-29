import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const { subscribed, checkSubscription, checkingSubscription } = useAuth();
  const [attempts, setAttempts] = useState(0);

  // لا يوجد تحقق تلقائي - المستخدم يربط يدوياً

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-3">
            <img src={logo} alt="ماعون" className="h-16 w-16" />
            <h1 className="text-2xl font-bold">ماعون</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-md">
        <Card className="p-8">
          <div className="text-center space-y-6">
            <CheckCircle className="h-16 w-16 text-accent mx-auto" />
            <h2 className="text-2xl font-bold">شكراً لإتمام عملية الدفع!</h2>
            <p className="text-muted-foreground">
              لتفعيل اشتراكك على هذا الجهاز، يرجى إدخال بريدك الإلكتروني الذي استخدمته في الدفع
            </p>
          </div>

          <div className="flex flex-col gap-3 mt-8">
            <Button
              onClick={() => navigate("/link-subscription")}
              className="gap-2"
              size="lg"
            >
              <Crown className="h-5 w-5" />
              ربط الاشتراك بهذا الجهاز
            </Button>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              size="lg"
            >
              العودة للرئيسية
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default SubscriptionSuccess;
