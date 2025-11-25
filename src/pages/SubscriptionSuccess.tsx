import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const { checkSubscription } = useAuth();

  useEffect(() => {
    checkSubscription();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="mb-6">
          <img src={logo} alt="ماعون" className="h-20 w-20 mx-auto mb-4" />
          <CheckCircle className="h-16 w-16 text-accent mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">تم الاشتراك بنجاح!</h1>
          <p className="text-muted-foreground">
            شكراً لاشتراكك في ماعون. يمكنك الآن الاستفادة من جميع ميزات التحليل.
          </p>
        </div>

        <div className="space-y-3">
          <Button onClick={() => navigate("/")} className="w-full gap-2" size="lg">
            <ArrowRight className="h-5 w-5" />
            ابدأ التحليل الآن
          </Button>
          <Button
            onClick={() => navigate("/pricing")}
            variant="outline"
            className="w-full"
          >
            عرض تفاصيل الاشتراك
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;
