import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Loader2, Link as LinkIcon } from "lucide-react";

const getDeviceId = () => {
  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("deviceId", deviceId);
  }
  return deviceId;
};

export default function LinkSubscription() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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
          description: data.message || "تم ربط الاشتراك بنجاح!",
        });
        
        // Redirect to home after 2 seconds
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        console.error("[LINK-SUB] Failed", data);
        toast({
          title: "خطأ",
          description: data?.message || "حدث خطأ أثناء ربط الاشتراك",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[LINK-SUB] Exception caught:", error);
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء ربط الاشتراك",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <LinkIcon className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">ربط الاشتراك</CardTitle>
          <CardDescription>
            أدخل البريد الإلكتروني المستخدم في عملية الدفع لربط اشتراكك بهذا الجهاز
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              dir="ltr"
              className="text-left"
            />
          </div>

          <Button
            onClick={handleLink}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الربط...
              </>
            ) : (
              "ربط الاشتراك"
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="w-full"
            disabled={isLoading}
          >
            العودة للرئيسية
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
