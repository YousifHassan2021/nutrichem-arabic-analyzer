import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

const Pricing = () => {
  const { user, subscribed, subscriptionEnd, checkingSubscription, checkSubscription } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isManaging, setIsManaging] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("يرجى تسجيل الدخول أولاً");
      navigate("/auth");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
      
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast.error("حدث خطأ أثناء إنشاء جلسة الدفع");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsManaging(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast.error("حدث خطأ أثناء فتح بوابة الإدارة");
    } finally {
      setIsManaging(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src={logo} alt="ماعون" className="h-16 w-16 md:h-20 md:w-20" />
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-foreground">
                  ماعون
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground">
                  خطط الاشتراك
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate("/")}>
              العودة للرئيسية
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            اختر الخطة المناسبة لك
          </h2>
          <p className="text-muted-foreground text-lg">
            احصل على تحليل شامل ودقيق لمكونات منتجاتك
          </p>
        </div>

        {subscribed && (
          <Card className="p-6 bg-accent/10 border-accent mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Crown className="h-6 w-6 text-accent" />
              <h3 className="font-semibold text-lg">اشتراكك النشط</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              اشتراكك نشط حالياً ويستمر حتى:{" "}
              {subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString("ar-SA") : "غير محدد"}
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleManageSubscription}
                disabled={isManaging}
                variant="outline"
              >
                {isManaging ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري التحميل...
                  </>
                ) : (
                  "إدارة الاشتراك"
                )}
              </Button>
              <Button
                onClick={checkSubscription}
                disabled={checkingSubscription}
                variant="ghost"
              >
                {checkingSubscription ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري التحقق...
                  </>
                ) : (
                  "تحديث حالة الاشتراك"
                )}
              </Button>
            </div>
          </Card>
        )}

        <div className="grid md:grid-cols-1 gap-8 max-w-md mx-auto">
          <Card className={`p-8 ${subscribed ? "border-accent shadow-lg" : ""}`}>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">الاشتراك الشهري</h3>
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-4xl font-bold">10</span>
                <span className="text-xl text-muted-foreground">ريال / شهر</span>
              </div>
              <p className="text-muted-foreground">
                وصول غير محدود لتحليل المكونات
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <span className="text-sm">تحليل غير محدود للمنتجات</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <span className="text-sm">تحليل علمي شامل ودقيق</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <span className="text-sm">كشف المكونات الضارة والمضللة</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <span className="text-sm">تقييم حلال/حرام للمنتجات</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <span className="text-sm">دعم المنتجات الغذائية والتجميلية</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <span className="text-sm">رفع الصور والمسح الضوئي</span>
              </div>
            </div>

            {subscribed ? (
              <Button
                onClick={handleManageSubscription}
                disabled={isManaging}
                className="w-full"
                size="lg"
              >
                {isManaging ? (
                  <>
                    <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                    جاري التحميل...
                  </>
                ) : (
                  <>
                    <Crown className="ml-2 h-5 w-5" />
                    إدارة الاشتراك
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleSubscribe}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                    جاري التحميل...
                  </>
                ) : (
                  <>
                    <Crown className="ml-2 h-5 w-5" />
                    اشترك الآن
                  </>
                )}
              </Button>
            )}
          </Card>
        </div>

        <Card className="p-6 bg-muted/50 mt-8">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            <strong>ملاحظة:</strong> يمكنك إلغاء الاشتراك في أي وقت من خلال بوابة إدارة الاشتراك.
            الدفع آمن ومشفر عبر Stripe.
          </p>
        </Card>
      </main>
    </div>
  );
};

export default Pricing;
