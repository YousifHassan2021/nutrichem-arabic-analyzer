import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const { checkSubscription } = useAuth();

  useEffect(() => {
    checkSubscription();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-3xl">تم الاشتراك بنجاح!</CardTitle>
          <CardDescription className="text-lg">
            شكراً لك على الاشتراك في NutriChem Premium
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            يمكنك الآن الاستمتاع بجميع ميزات التطبيق المتميزة
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate("/")} size="lg">
              ابدأ التحليل
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;
