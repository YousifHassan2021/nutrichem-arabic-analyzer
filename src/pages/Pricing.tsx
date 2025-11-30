import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Crown, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

// دالة للحصول على أو إنشاء معرف جهاز فريد
const getDeviceId = () => {
  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("deviceId", deviceId);
  }
  return deviceId;
};

const Pricing = () => {
  const { subscribed, subscriptionEnd, checkingSubscription, checkSubscription } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isManaging, setIsManaging] = useState(false);

  // إعادة توجيه المشتركين للصفحة الرئيسية
  useEffect(() => {
    if (subscribed) {
      navigate("/");
    }
  }, [subscribed, navigate]);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const deviceId = getDeviceId();

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { deviceId }
      });
      
      if (error) {
        console.error("Checkout error:", error);
        throw error;
      }
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("لم يتم استلام رابط الدفع");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast.error("حدث خطأ أثناء إنشاء جلسة الدفع: " + (error as Error).message);
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

        <div className="grid md:grid-cols-1 gap-8 max-w-md mx-auto">
          <Card className={`p-8 ${subscribed ? "border-accent shadow-lg" : ""}`}>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">الاشتراك ربع السنوي</h3>
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-4xl font-bold">12</span>
                <span className="text-xl text-muted-foreground">ريال / 3 أشهر</span>
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

            <div className="space-y-3">
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
                
                <Button
                  onClick={() => navigate("/link-subscription")}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <LinkIcon className="ml-2 h-5 w-5" />
                  دفعت بالفعل؟ اربط اشتراكك
                </Button>
              </div>
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
