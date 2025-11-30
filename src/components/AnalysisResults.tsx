import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  ScanFace,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { NanoVisualization } from "@/components/visualization/NanoVisualization";
import { ARView } from "@/components/ar/ARView";
import { useState } from "react";
import bodyEffectsImage from "@/assets/body-effects-visualization.jpg";

interface AnalysisResult {
  productName: string;
  overallScore: number;
  verdict: string;
  summary: string;
  halalStatus: string;
  negativeIngredients: Array<{
    name: string;
    description: string;
    severity: string;
    impact: string;
    affectedOrgan?: string;
  }>;
  positiveIngredients: Array<{
    name: string;
    description: string;
    benefit: string;
    affectedOrgan?: string;
  }>;
  suspiciousIngredients: Array<{
    name: string;
    description: string;
    concern: string;
    affectedOrgan?: string;
  }>;
  recommendations: string[];
}

interface AnalysisResultsProps {
  result: AnalysisResult;
  onReset: () => void;
}

const AnalysisResults = ({ result, onReset }: AnalysisResultsProps) => {
  const [showAR, setShowAR] = useState(false);
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-primary";
    if (score >= 40) return "text-warning";
    return "text-destructive";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-success/20 to-success/5";
    if (score >= 60) return "from-primary/20 to-primary/5";
    if (score >= 40) return "from-warning/20 to-warning/5";
    return "from-destructive/20 to-destructive/5";
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, { variant: "destructive" | "warning" | "default"; text: string }> = {
      "خطر": { variant: "destructive", text: "خطر" },
      "عالي": { variant: "destructive", text: "عالي" },
      "متوسط": { variant: "warning", text: "متوسط" },
    };
    const config = variants[severity] || { variant: "default", text: severity };
    return <Badge variant={config.variant as any}>{config.text}</Badge>;
  };

  const getHalalBadge = (status: string) => {
    const isHalal = status?.toLowerCase().includes("حلال");
    return (
      <Badge 
        variant={isHalal ? "default" : "destructive"}
        className={`text-base px-4 py-1 ${isHalal ? "bg-success text-white" : "bg-destructive text-white"}`}
      >
        {isHalal ? "✓ حلال" : "✗ حرام"}
      </Badge>
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header with Score */}
      <Card className={`p-8 bg-gradient-to-br ${getScoreGradient(result.overallScore)} border-2`}>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-foreground">{result.productName}</h2>
              <div className="flex gap-2 flex-wrap">
                <Badge className="text-sm" variant="outline">
                  {result.verdict}
                </Badge>
                {result.halalStatus && getHalalBadge(result.halalStatus)}
              </div>
            </div>
            <div className="text-left">
              <div className={`text-5xl font-bold ${getScoreColor(result.overallScore)}`}>
                {result.overallScore}
              </div>
              <div className="text-sm text-muted-foreground">من 100</div>
            </div>
          </div>
          <p className="text-base text-foreground/90 leading-relaxed">{result.summary}</p>
          
          {/* AR Button */}
          <div className="pt-4">
            <Button
              onClick={() => setShowAR(true)}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              size="lg"
            >
              <ScanFace className="ml-2 h-5 w-5" />
              عرض التأثيرات بتقنية الواقع المعزز
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              شاهد كيف تؤثر المكونات على جسمك باستخدام الكاميرا
            </p>
          </div>
        </div>
      </Card>

      {/* AR View */}
      {showAR && (
        <ARView
          negativeIngredients={result.negativeIngredients || []}
          positiveIngredients={result.positiveIngredients || []}
          suspiciousIngredients={result.suspiciousIngredients || []}
          onClose={() => setShowAR(false)}
        />
      )}

      {/* Effects Visualization Image */}
      {(result.negativeIngredients?.length > 0 || result.positiveIngredients?.length > 0) && (
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-background">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">تأثير المكونات على الجسم</h3>
            <p className="text-sm text-muted-foreground">
              صورة توضيحية تُظهر كيف تؤثر المكونات السلبية والإيجابية على أعضاء جسمك المختلفة
            </p>
            <Separator />
            <div className="relative rounded-lg overflow-hidden">
              <img 
                src={bodyEffectsImage} 
                alt="تأثير المكونات على أعضاء الجسم" 
                className="w-full h-auto object-contain max-h-[600px] mx-auto"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-4">
                <div className="flex items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-destructive animate-pulse"></div>
                    <span className="text-destructive-foreground font-medium">المكونات السلبية</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-success animate-pulse"></div>
                    <span className="text-success-foreground font-medium">المكونات الإيجابية</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Nano Visualization */}
      {(result.negativeIngredients?.length > 0 || result.positiveIngredients?.length > 0) && (
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">التصور النانوي التفاعلي</h3>
            <p className="text-sm text-muted-foreground">
              استكشف كيف تؤثر المكونات على جسمك. انقر على أي عضو لعرض التفاصيل.
            </p>
            <Separator />
            <NanoVisualization 
              negativeIngredients={result.negativeIngredients || []}
              positiveIngredients={result.positiveIngredients || []}
              suspiciousIngredients={result.suspiciousIngredients || []}
            />
          </div>
        </Card>
      )}

      {/* Negative Ingredients */}
      {result.negativeIngredients && result.negativeIngredients.length > 0 && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h3 className="text-xl font-semibold text-foreground">
                مكونات سلبية ({result.negativeIngredients.length})
              </h3>
            </div>
            <Separator />
            <div className="space-y-4">
              {result.negativeIngredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-destructive/5 border border-destructive/20"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="font-semibold text-foreground">{ingredient.name}</h4>
                    {getSeverityBadge(ingredient.severity)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                    {ingredient.description}
                  </p>
                  <div className="flex items-start gap-2 text-sm">
                    <ArrowRight className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <span className="text-destructive font-medium">{ingredient.impact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Suspicious Ingredients */}
      {result.suspiciousIngredients && result.suspiciousIngredients.length > 0 && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-warning" />
              <h3 className="text-xl font-semibold text-foreground">
                مكونات مشكوك فيها ({result.suspiciousIngredients.length})
              </h3>
            </div>
            <Separator />
            <div className="space-y-4">
              {result.suspiciousIngredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-warning/5 border border-warning/20"
                >
                  <h4 className="font-semibold text-foreground mb-2">{ingredient.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                    {ingredient.description}
                  </p>
                  <div className="flex items-start gap-2 text-sm">
                    <ArrowRight className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                    <span className="text-warning font-medium">{ingredient.concern}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Positive Ingredients */}
      {result.positiveIngredients && result.positiveIngredients.length > 0 && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <h3 className="text-xl font-semibold text-foreground">
                مكونات إيجابية ({result.positiveIngredients.length})
              </h3>
            </div>
            <Separator />
            <div className="space-y-4">
              {result.positiveIngredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-success/5 border border-success/20"
                >
                  <h4 className="font-semibold text-foreground mb-2">{ingredient.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                    {ingredient.description}
                  </p>
                  <div className="flex items-start gap-2 text-sm">
                    <ArrowRight className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-success font-medium">{ingredient.benefit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Recommendations */}
      {result.recommendations && result.recommendations.length > 0 && (
        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">التوصيات</h3>
            <Separator />
            <ul className="space-y-3">
              {result.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="bg-primary/20 rounded-full p-1 mt-0.5">
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm text-foreground leading-relaxed flex-1">
                    {recommendation}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {/* Reset Button */}
      <div className="flex justify-center pt-4">
        <Button onClick={onReset} variant="outline" size="lg">
          <RotateCcw className="ml-2 h-5 w-5" />
          تحليل منتج آخر
        </Button>
      </div>

      {/* Disclaimer */}
      <Card className="p-4 bg-muted/50">
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          <strong>تنويه:</strong> هذا التحليل لأغراض إعلامية وتعليمية فقط وليس بديلاً عن
          استشارة أخصائي تغذية أو طبيب مؤهل.
        </p>
      </Card>
    </div>
  );
};

export default AnalysisResults;
