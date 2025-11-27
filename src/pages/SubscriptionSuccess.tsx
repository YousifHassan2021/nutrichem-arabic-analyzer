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

  useEffect(() => {
    // التحقق من الاشتراك فوراً
    checkSubscription();
    
    // استمرار المحاولة حتى يتم التفعيل
    const interval = setInterval(() => {
      if (!subscribed && attempts < 30) {
        checkSubscription();
        setAttempts(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [subscribed, attempts, checkSubscription]);

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
            {subscribed ? (
              <>
                <CheckCircle className="h-16 w-16 text-accent mx-auto" />
                <h2 className="text-2xl font-bold">تم تفعيل اشتراكك بنجاح!</h2>
                <p className="text-muted-foreground">
                  يمكنك الآن البدء في استخدام جميع ميزات التطبيق على هذا الجهاز
                </p>
              </>
            ) : (
              <>
                <Loader2 className="h-16 w-16 text-accent mx-auto animate-spin" />
                <h2 className="text-2xl font-bold">جاري التحقق من الاشتراك...</h2>
                <p className="text-muted-foreground">
                  يرجى الانتظار بينما نقوم بتفعيل اشتراكك على هذا الجهاز
                </p>
              </>
            )}
          </div>

          <div className="flex flex-col gap-3 mt-8">
            <Button
              onClick={() => navigate("/")}
              disabled={!subscribed || checkingSubscription}
              className="gap-2"
              size="lg"
            >
              <Crown className="h-5 w-5" />
              ابدأ التحليل
            </Button>
            <Button
              onClick={() => navigate("/pricing")}
              disabled={!subscribed || checkingSubscription}
              variant="outline"
              size="lg"
            >
              عرض تفاصيل الاشتراك
            </Button>
            {!subscribed && !checkingSubscription && (
              <Button
                onClick={() => navigate("/link-subscription")}
                variant="outline"
                size="lg"
              >
                دفعت بالفعل؟ اربط اشتراكك
              </Button>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default SubscriptionSuccess;
