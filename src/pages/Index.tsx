import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Beaker, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AnalysisResults from "@/components/AnalysisResults";

interface AnalysisResult {
  productName: string;
  overallScore: number;
  verdict: string;
  summary: string;
  negativeIngredients: Array<{
    name: string;
    description: string;
    severity: string;
    impact: string;
  }>;
  positiveIngredients: Array<{
    name: string;
    description: string;
    benefit: string;
  }>;
  suspiciousIngredients: Array<{
    name: string;
    description: string;
    concern: string;
  }>;
  recommendations: string[];
}

const Index = () => {
  const [productName, setProductName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!productName.trim() || !ingredients.trim()) {
      toast.error("يرجى إدخال اسم المنتج والمكونات");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-ingredients", {
        body: { productName, ingredients },
      });

      if (error) throw error;

      setAnalysisResult(data);
      toast.success("تم التحليل بنجاح!");
    } catch (error) {
      console.error("Error analyzing ingredients:", error);
      toast.error("حدث خطأ أثناء التحليل. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setProductName("");
    setIngredients("");
    setAnalysisResult(null);
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Beaker className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                المجلس العلمي للكيمياء الغذائية
              </h1>
              <p className="text-sm text-muted-foreground">
                NutriChem-V4.0 Scientific Directorate
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {!analysisResult ? (
          <div className="space-y-8">
            {/* Info Banner */}
            <Card className="p-6 bg-primary/5 border-primary/20">
              <div className="flex gap-4">
                <AlertCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div className="space-y-2">
                  <h2 className="font-semibold text-foreground">
                    نظام تحليل علمي شامل
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    نقوم بفحص دقيق لمكونات المنتجات استناداً إلى أدلة علمية من هيئات معترف
                    بها مثل FDA و EFSA. نكشف الأنماط المضللة ونقدم تحليلاً تحوطياً لحماية
                    صحتك.
                  </p>
                </div>
              </div>
            </Card>

            {/* Input Form */}
            <Card className="p-6 md:p-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    اسم المنتج
                  </label>
                  <Input
                    placeholder="مثال: عصير برتقال طبيعي"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    قائمة المكونات
                  </label>
                  <Textarea
                    placeholder="أدخل قائمة المكونات كما هي مكتوبة على المنتج..."
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    className="min-h-[200px] text-base leading-relaxed"
                  />
                  <p className="text-xs text-muted-foreground">
                    انسخ المكونات من عبوة المنتج والصقها هنا
                  </p>
                </div>

                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  size="lg"
                  className="w-full"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                      جاري التحليل...
                    </>
                  ) : (
                    <>
                      <Beaker className="ml-2 h-5 w-5" />
                      تحليل المكونات
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Disclaimer */}
            <Card className="p-4 bg-muted/50">
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                <strong>تنويه:</strong> هذا التحليل لأغراض إعلامية وتعليمية فقط وليس بديلاً
                عن استشارة أخصائي تغذية أو طبيب مؤهل.
              </p>
            </Card>
          </div>
        ) : (
          <AnalysisResults result={analysisResult} onReset={handleReset} />
        )}
      </main>
    </div>
  );
};

export default Index;
