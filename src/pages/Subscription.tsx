import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Crown, Calendar, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Subscription = () => {
  const { user, subscription, checkSubscription, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إنشاء جلسة الدفع",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء فتح بوابة العملاء",
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background p-4">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">الاشتراكات</h1>
          <Button variant="outline" onClick={signOut}>
            تسجيل الخروج
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              الاشتراك المتميز
            </CardTitle>
            <CardDescription>
              احصل على وصول غير محدود لتحليل المكونات الغذائية
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {subscription?.subscribed ? (
              <div className="space-y-4">
                <div className="p-4 border border-primary bg-primary/5 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <Crown className="h-4 w-4" />
                    <span>مشترك حالياً</span>
                  </div>
                  {subscription.subscription_end && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        ينتهي في: {new Date(subscription.subscription_end).toLocaleDateString("ar-SA")}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={handleManageSubscription} 
                    disabled={portalLoading}
                    className="flex-1"
                    variant="outline"
                  >
                    {portalLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    <CreditCard className="ml-2 h-4 w-4" />
                    إدارة الاشتراك
                  </Button>
                  <Button 
                    onClick={checkSubscription}
                    variant="outline"
                  >
                    تحديث الحالة
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-6 border border-dashed rounded-lg text-center space-y-4">
                  <div className="text-4xl font-bold text-primary">10 ر.س</div>
                  <div className="text-muted-foreground">كل 3 أشهر</div>
                  <ul className="text-right space-y-2 max-w-md mx-auto">
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      <span>تحليل غير محدود للمكونات</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      <span>تحديد حلال أو حرام</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      <span>مسح الباركود</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      <span>تحليل علمي مفصل</span>
                    </li>
                  </ul>
                </div>
                <Button 
                  onClick={handleSubscribe} 
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  <Crown className="ml-2 h-4 w-4" />
                  اشترك الآن
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Button 
          variant="outline" 
          onClick={() => navigate("/")}
          className="w-full"
        >
          العودة إلى الصفحة الرئيسية
        </Button>
      </div>
    </div>
  );
};

export default Subscription;
