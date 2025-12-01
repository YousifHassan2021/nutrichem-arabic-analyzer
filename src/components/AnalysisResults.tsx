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
  Lightbulb,
  Activity,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { FaceARView } from "@/components/ar/FaceARView";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { InteractiveBodySVG } from "./InteractiveBodySVG";

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
  skinType: string | null;
  onReset: () => void;
}

const AnalysisResults = ({ result, skinType, onReset }: AnalysisResultsProps) => {
  const [showFaceAR, setShowFaceAR] = useState(false);
  const { toast } = useToast();

  // تحويل بيانات التحليل إلى قائمة الأعضاء المتأثرة
  const affectedOrgans = useMemo(() => {
    const organs: Array<{
      id: string;
      severity: "safe" | "moderate" | "severe";
      ingredients: string[];
      description: string;
    }> = [];

    // خريطة الأعضاء المعتمدة
    const organMap: Record<string, string> = {
      كبد: "liver",
      الكبد: "liver",
      liver: "liver",
      كلى: "kidneys",
      الكلى: "kidneys",
      كلية: "kidneys",
      kidneys: "kidneys",
      kidney: "kidneys",
      جلد: "skin",
      الجلد: "skin",
      بشرة: "skin",
      skin: "skin",
      رئة: "lungs",
      رئتين: "lungs",
      الرئتين: "lungs",
      lungs: "lungs",
      lung: "lungs",
      دماغ: "brain",
      المخ: "brain",
      الدماغ: "brain",
      brain: "brain",
      قلب: "heart",
      القلب: "heart",
      heart: "heart",
      معدة: "stomach",
      المعدة: "stomach",
      stomach: "stomach",
      أمعاء: "intestines",
      الأمعاء: "intestines",
      intestines: "intestines",
    };

    // معالجة المكونات السلبية
    result.negativeIngredients?.forEach((ing) => {
      if (ing.affectedOrgan) {
        const organKey = organMap[ing.affectedOrgan.toLowerCase().trim()];
        if (organKey) {
          const existing = organs.find((o) => o.id === organKey);
          if (existing) {
            existing.ingredients.push(ing.name);
            if (existing.severity !== "severe") {
              existing.severity = ing.severity === "خطر" || ing.severity === "عالي" ? "severe" : "moderate";
            }
          } else {
            organs.push({
              id: organKey,
              severity: ing.severity === "خطر" || ing.severity === "عالي" ? "severe" : "moderate",
              ingredients: [ing.name],
              description: `تأثير ضار: ${ing.impact}`,
            });
          }
        }
      }
    });

    // معالجة المكونات المشكوك فيها
    result.suspiciousIngredients?.forEach((ing) => {
      if (ing.affectedOrgan) {
        const organKey = organMap[ing.affectedOrgan.toLowerCase().trim()];
        if (organKey) {
          const existing = organs.find((o) => o.id === organKey);
          if (existing) {
            existing.ingredients.push(ing.name);
          } else {
            organs.push({
              id: organKey,
              severity: "moderate",
              ingredients: [ing.name],
              description: `مكون مشكوك فيه: ${ing.concern}`,
            });
          }
        }
      }
    });

    // معالجة المكونات الإيجابية
    result.positiveIngredients?.forEach((ing) => {
      if (ing.affectedOrgan) {
        const organKey = organMap[ing.affectedOrgan.toLowerCase().trim()];
        if (organKey) {
          const existing = organs.find((o) => o.id === organKey);
          if (existing && existing.severity !== "severe" && existing.severity !== "moderate") {
            existing.ingredients.push(ing.name);
            existing.severity = "safe";
            existing.description = `تأثير إيجابي: ${ing.benefit}`;
          } else if (!existing) {
            organs.push({
              id: organKey,
              severity: "safe",
              ingredients: [ing.name],
              description: `تأثير إيجابي: ${ing.benefit}`,
            });
          }
        }
      }
    });

    return organs;
  }, [result]);
  
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

  const getPersonalizedRecommendations = () => {
    if (!skinType) return [];

    const recommendations: string[] = [];
    const negativeIngredients = result.negativeIngredients || [];
    const positiveIngredients = result.positiveIngredients || [];

    // توصيات محددة بناءً على تأثير المكونات على نوع البشرة
    if (negativeIngredients.length > 0) {
      negativeIngredients.forEach(ing => {
        const lowerName = ing.name.toLowerCase();
        const lowerImpact = ing.impact?.toLowerCase() || '';
        
        // تحذيرات للبشرة الجافة
        if (skinType === 'dry') {
          if (lowerName.includes('كحول') || lowerName.includes('alcohol')) {
            recommendations.push(`⚠️ ${ing.name}: يزيد من جفاف بشرتك ويسبب تهيج - تجنب هذا المنتج تماماً`);
          } else if (lowerImpact.includes('جفاف') || lowerImpact.includes('تقشير')) {
            recommendations.push(`⚠️ ${ing.name}: ${ing.impact} - غير مناسب للبشرة الجافة`);
          }
        }
        
        // تحذيرات للبشرة الدهنية
        if (skinType === 'oily') {
          if (lowerName.includes('زيت') || lowerName.includes('oil') && !lowerName.includes('معدنية')) {
            recommendations.push(`⚠️ ${ing.name}: يزيد من إفراز الدهون ويسد المسام - تجنب إذا كانت بشرتك دهنية`);
          } else if (lowerImpact.includes('دهني') || lowerImpact.includes('لمعان')) {
            recommendations.push(`⚠️ ${ing.name}: ${ing.impact} - قد يسبب زيادة في دهنية البشرة`);
          }
        }
        
        // تحذيرات للبشرة الحساسة
        if (skinType === 'sensitive') {
          if (lowerName.includes('عطر') || lowerName.includes('fragrance') || lowerName.includes('parfum')) {
            recommendations.push(`⚠️ ${ing.name}: يسبب تهيج وحساسية شديدة - خطر على بشرتك الحساسة`);
          } else if (lowerName.includes('كبريتات') || lowerName.includes('sulfate')) {
            recommendations.push(`⚠️ ${ing.name}: مهيج قوي للبشرة الحساسة - تجنب تماماً`);
          } else if (lowerImpact.includes('تهيج') || lowerImpact.includes('حساسية') || lowerImpact.includes('التهاب')) {
            recommendations.push(`⚠️ ${ing.name}: ${ing.impact} - خطر مضاعف على البشرة الحساسة`);
          }
        }
        
        // تحذيرات للبشرة المختلطة
        if (skinType === 'combination') {
          if (lowerImpact.includes('توازن') || (lowerName.includes('زيت') && lowerName.includes('ثقيل'))) {
            recommendations.push(`⚠️ ${ing.name}: يخل بتوازن بشرتك المختلطة - قد يسبب جفاف في مناطق ودهون في أخرى`);
          }
        }
      });
    }

    // توصيات إيجابية بناءً على المكونات المفيدة
    if (positiveIngredients.length > 0) {
      positiveIngredients.forEach(ing => {
        const lowerName = ing.name.toLowerCase();
        const lowerBenefit = ing.benefit?.toLowerCase() || '';
        
        // فوائد للبشرة الجافة
        if (skinType === 'dry') {
          if (lowerName.includes('هيالورونيك') || lowerName.includes('hyaluronic') || 
              lowerName.includes('جلسرين') || lowerName.includes('glycerin') ||
              lowerName.includes('سيراميد') || lowerName.includes('ceramide')) {
            recommendations.push(`✅ ممتاز! ${ing.name}: مرطب قوي يحبس الرطوبة - مثالي لبشرتك الجافة`);
          } else if (lowerBenefit.includes('ترطيب') || lowerBenefit.includes('نعومة')) {
            recommendations.push(`✅ ${ing.name}: ${ing.benefit} - رائع للبشرة الجافة`);
          }
        }
        
        // فوائد للبشرة الدهنية
        if (skinType === 'oily') {
          if (lowerName.includes('ساليسيليك') || lowerName.includes('salicylic') || 
              lowerName.includes('نياسيناميد') || lowerName.includes('niacinamide') ||
              lowerName.includes('زنك') || lowerName.includes('zinc')) {
            recommendations.push(`✅ ممتاز! ${ing.name}: ينظم إفراز الدهون ويقلل اللمعان - مثالي لبشرتك الدهنية`);
          } else if (lowerBenefit.includes('مات') || lowerBenefit.includes('تحكم دهون') || lowerBenefit.includes('مسام')) {
            recommendations.push(`✅ ${ing.name}: ${ing.benefit} - رائع للبشرة الدهنية`);
          }
        }
        
        // فوائد للبشرة الحساسة
        if (skinType === 'sensitive') {
          if (lowerName.includes('صبار') || lowerName.includes('aloe') || 
              lowerName.includes('بانثينول') || lowerName.includes('panthenol') ||
              lowerName.includes('كاموميل') || lowerName.includes('chamomile')) {
            recommendations.push(`✅ ممتاز! ${ing.name}: مهدئ ومضاد للالتهاب - آمن تماماً لبشرتك الحساسة`);
          } else if (lowerBenefit.includes('تهدئة') || lowerBenefit.includes('حماية')) {
            recommendations.push(`✅ ${ing.name}: ${ing.benefit} - مناسب للبشرة الحساسة`);
          }
        }
        
        // فوائد للبشرة المختلطة
        if (skinType === 'combination') {
          if (lowerBenefit.includes('توازن') || lowerName.includes('niacinamide')) {
            recommendations.push(`✅ ${ing.name}: ${ing.benefit} - مثالي لتوازن بشرتك المختلطة`);
          }
        }
      });
    }

    // توصيات عامة إذا لم تكن هناك توصيات محددة
    if (recommendations.length === 0) {
      const skinTypeAdvice: Record<string, string[]> = {
        dry: [
          'ابحث عن منتجات غنية بالمرطبات مثل حمض الهيالورونيك والجلسرين',
          'تجنب المنتجات التي تحتوي على الكحول',
          'استخدم كريمات غنية وزيوت طبيعية'
        ],
        oily: [
          'اختر منتجات خفيفة ومائية القوام',
          'ابحث عن مكونات تنظم الدهون مثل النياسيناميد',
          'تجنب المنتجات الزيتية الثقيلة'
        ],
        combination: [
          'استخدم منتجات متوازنة تناسب جميع المناطق',
          'ركز على الترطيب الخفيف',
          'نظم إفراز الدهون في منطقة T'
        ],
        sensitive: [
          'تجنب العطور والمواد المهيجة بشكل كامل',
          'اختر منتجات هيبوالرجينيك ومختبرة طبياً',
          'ابحث عن مكونات مهدئة طبيعية'
        ],
        normal: [
          'حافظ على روتين عناية متوازن',
          'استخدم واقي شمس يومياً',
          'ركز على الوقاية والحماية'
        ]
      };
      recommendations.push(...(skinTypeAdvice[skinType] || []));
    }

    return recommendations;
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
              onClick={() => setShowFaceAR(true)}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              size="lg"
            >
              <ScanFace className="ml-2 h-5 w-5" />
              معاينة التأثير على الوجه
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              شاهد تأثيرات المنتج مباشرة على وجهك باستخدام تقنية التعرف على الوجه
            </p>
          </div>
        </div>
      </Card>

      {/* Personalized Recommendations */}
      {skinType && getPersonalizedRecommendations().length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/30">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-accent" />
            <h3 className="text-lg font-bold text-foreground">
              توصيات مخصصة حسب نوع بشرتك
            </h3>
          </div>
          <div className="space-y-3">
            {getPersonalizedRecommendations().map((recommendation, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-4 rounded-lg bg-background/70 backdrop-blur-sm border border-accent/10"
              >
                <span className="text-sm font-semibold text-accent mt-0.5 min-w-[24px]">
                  {index + 1}
                </span>
                <p className="text-sm text-foreground leading-relaxed flex-1">
                  {recommendation}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Face AR View */}
      {showFaceAR && (
        <FaceARView
          negativeIngredients={result.negativeIngredients || []}
          positiveIngredients={result.positiveIngredients || []}
          suspiciousIngredients={result.suspiciousIngredients || []}
          onClose={() => setShowFaceAR(false)}
        />
      )}

      {/* Interactive Body Visualization */}
      {affectedOrgans.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-muted/30 to-background border-border/50">
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                تأثير المكونات على أعضاء الجسم
              </h3>
              <p className="text-sm text-muted-foreground">
                اضغط على أي عضو لمعرفة التأثير المحتمل والمكونات المسؤولة
              </p>
            </div>
            
            <Separator />
            
            <InteractiveBodySVG affectedOrgans={affectedOrgans} />
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
