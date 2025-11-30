import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

const getDeviceId = () => {
  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("deviceId", deviceId);
  }
  return deviceId;
};

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLink = async () => {
    if (!email.trim()) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال البريد الإلكتروني",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const deviceId = getDeviceId();
      console.log("[LINK-SUB] Starting link process", { deviceId, email: email.trim().toLowerCase() });
      
      const { data, error } = await supabase.functions.invoke("link-device-subscription", {
        body: { deviceId, email: email.trim().toLowerCase() },
      });

      console.log("[LINK-SUB] Response received", { data, error });

      if (error) {
        console.error("[LINK-SUB] Error from function", error);
        throw error;
      }

      if (data?.success) {
        console.log("[LINK-SUB] Success!", data);
        toast({
          title: "تم بنجاح!",
          description: data.message || "تم تفعيل الاشتراك بنجاح!",
        });
        
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        console.error("[LINK-SUB] Failed", data);
        toast({
          title: "خطأ",
          description: data?.message || "حدث خطأ أثناء تفعيل الاشتراك",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[LINK-SUB] Exception caught:", error);
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء تفعيل الاشتراك",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
              أدخل البريد الإلكتروني المستخدم في الدفع لتفعيل اشتراكك فوراً
            </p>
          </div>

          <div className="space-y-4 mt-8">
            <Input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              dir="ltr"
              className="text-left"
            />

            <Button
              onClick={handleLink}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  جاري التفعيل...
                </>
              ) : (
                "تفعيل الاشتراك"
              )}
            </Button>

            <Button
              onClick={() => navigate("/")}
              variant="outline"
              size="lg"
              className="w-full"
              disabled={isLoading}
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
