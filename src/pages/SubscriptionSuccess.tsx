import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const { subscribed, checkSubscription, checkingSubscription, user } = useAuth();
  const [attempts, setAttempts] = useState(0);
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    const activateSubscription = async () => {
      const pendingEmail = localStorage.getItem("pendingSubscriptionEmail");
      
      if (pendingEmail && !user) {
        setIsActivating(true);
        try {
          // إنشاء حساب تلقائي بكلمة مرور عشوائية
          const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
          
          const { data, error } = await supabase.auth.signUp({
            email: pendingEmail,
            password: randomPassword,
            options: {
              emailRedirectTo: `${window.location.origin}/`,
              data: {
                auto_created: true
              }
            }
          });

          if (error && error.message.includes("already registered")) {
            // إذا كان الحساب موجود، نسجل الدخول
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email: pendingEmail,
              password: randomPassword
            });

            if (signInError) {
              toast.error("حدث خطأ في تفعيل الاشتراك. يرجى تسجيل الدخول يدوياً.");
            }
          } else if (error) {
            console.error("Signup error:", error);
            toast.error("حدث خطأ في إنشاء الحساب");
          } else {
            toast.success("تم تفعيل اشتراكك بنجاح!");
          }

          localStorage.removeItem("pendingSubscriptionEmail");
        } catch (error) {
          console.error("Activation error:", error);
        } finally {
          setIsActivating(false);
        }
      }
    };

    activateSubscription();
  }, [user]);

  useEffect(() => {
    if (user) {
      checkSubscription();
      
      const interval = setInterval(() => {
        if (!subscribed && attempts < 30) {
          checkSubscription();
          setAttempts(prev => prev + 1);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [subscribed, attempts, checkSubscription, user]);

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
            {isActivating ? (
              <>
                <Loader2 className="h-16 w-16 text-accent mx-auto animate-spin" />
                <h2 className="text-2xl font-bold">جاري تفعيل اشتراكك...</h2>
                <p className="text-muted-foreground">
                  يرجى الانتظار بينما نقوم بإعداد حسابك
                </p>
              </>
            ) : subscribed ? (
              <>
                <CheckCircle className="h-16 w-16 text-accent mx-auto" />
                <h2 className="text-2xl font-bold">تم تفعيل اشتراكك بنجاح!</h2>
                <p className="text-muted-foreground">
                  يمكنك الآن البدء في استخدام جميع ميزات التطبيق
                </p>
              </>
            ) : (
              <>
                <Loader2 className="h-16 w-16 text-accent mx-auto animate-spin" />
                <h2 className="text-2xl font-bold">جاري التحقق من الاشتراك...</h2>
                <p className="text-muted-foreground">
                  يرجى الانتظار بينما نقوم بتفعيل اشتراكك
                </p>
              </>
            )}
          </div>

          <div className="flex flex-col gap-3 mt-8">
            <Button
              onClick={() => navigate("/")}
              disabled={!subscribed || checkingSubscription || isActivating}
              className="gap-2"
              size="lg"
            >
              <Crown className="h-5 w-5" />
              ابدأ التحليل
            </Button>
            <Button
              onClick={() => navigate("/pricing")}
              disabled={!subscribed || checkingSubscription || isActivating}
              variant="outline"
              size="lg"
            >
              عرض تفاصيل الاشتراك
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default SubscriptionSuccess;
