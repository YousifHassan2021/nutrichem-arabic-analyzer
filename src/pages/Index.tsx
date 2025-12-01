import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Beaker, AlertCircle, Upload, X, ScanLine, Crown, Shield, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AnalysisResults from "@/components/AnalysisResults";
import { Wind, Droplets, Sun, Sparkles, Activity } from "lucide-react";
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import logo from "@/assets/logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

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

// Skin Type Selection Component
type SkinType = 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal';

const skinTypeConfig: Record<SkinType, {
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}> = {
  dry: {
    name: 'جافة',
    icon: <Wind className="h-6 w-6" />,
    description: 'بشرة تفتقر إلى الرطوبة',
    color: 'hover:bg-blue-500/10 hover:border-blue-500/50'
  },
  oily: {
    name: 'دهنية',
    icon: <Droplets className="h-6 w-6" />,
    description: 'بشرة تنتج الزيوت بكثرة',
    color: 'hover:bg-amber-500/10 hover:border-amber-500/50'
  },
  combination: {
    name: 'مختلطة',
    icon: <Sun className="h-6 w-6" />,
    description: 'دهنية في منطقة T وجافة في الخدود',
    color: 'hover:bg-purple-500/10 hover:border-purple-500/50'
  },
  sensitive: {
    name: 'حساسة',
    icon: <Activity className="h-6 w-6" />,
    description: 'تتفاعل بسهولة مع المنتجات',
    color: 'hover:bg-red-500/10 hover:border-red-500/50'
  },
  normal: {
    name: 'طبيعية',
    icon: <Sparkles className="h-6 w-6" />,
    description: 'بشرة متوازنة غير دهنية ولا جافة',
    color: 'hover:bg-green-500/10 hover:border-green-500/50'
  }
};

const Index = () => {
  const { subscribed, user } = useAuth();
  const navigate = useNavigate();
  const [productName, setProductName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [productType, setProductType] = useState<"food" | "cosmetic">("food");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [skinType, setSkinType] = useState<string | null>(null);
  const [showSkinTypeSelection, setShowSkinTypeSelection] = useState(true);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();

        setIsAdmin(!!data && !error);
      } catch (error) {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleAnalyze = async () => {
    if (!subscribed) {
      toast.error("يجب الاشتراك أولاً للوصول إلى خدمة التحليل");
      navigate("/pricing");
      return;
    }

    if (!productName.trim() && !imageFile) {
      toast.error("يرجى إدخال اسم المنتج أو رفع صورة");
      return;
    }

    if (!imageFile && !ingredients.trim()) {
      toast.error("يرجى إدخال المكونات أو رفع صورة");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const body: any = { productName, productType };
      
      if (imageFile) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(imageFile);
        });
        body.image = await base64Promise;
      } else {
        body.ingredients = ingredients;
      }

      const { data, error } = await supabase.functions.invoke("analyze-ingredients", {
        body,
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
    setProductType("food");
    setAnalysisResult(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleBarcodeScanner = async () => {
    if (!isNative) {
      toast.error("مسح الباركود متاح فقط في تطبيق الموبايل");
      return;
    }

    try {
      setIsScanning(true);

      // Request permissions
      const permissionStatus = await BarcodeScanner.requestPermissions();
      
      if (permissionStatus.camera !== 'granted') {
        toast.error("يجب السماح بالوصول إلى الكاميرا");
        setIsScanning(false);
        return;
      }

      // Start scanning
      const { barcodes } = await BarcodeScanner.scan();

      if (barcodes && barcodes.length > 0) {
        const barcode = barcodes[0].displayValue;
        toast.success(`تم مسح الباركود: ${barcode}`);
        
        // Here you would typically call an API to get product info
        // For now, we'll just set the product name
        setProductName(`منتج - ${barcode}`);
        
        // You could integrate with a barcode API here
        // For example: Open Food Facts API
        // fetchProductInfo(barcode);
      } else {
        toast.error("لم يتم العثور على باركود");
      }
    } catch (error) {
      console.error("Barcode scanning error:", error);
      toast.error("حدث خطأ أثناء مسح الباركود");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Floating Subscription Button */}
      {!subscribed && (
        <Button
          onClick={() => navigate("/pricing")}
          className="fixed bottom-6 left-6 z-50 gap-2 shadow-lg hover:shadow-xl transition-shadow animate-pulse"
          size="lg"
        >
          <Crown className="h-5 w-5" />
          اشترك الآن
        </Button>
      )}

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
                  فحص دقيق لمكونات المنتجات استنادا إلى أدلة علمية
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => navigate("/install")}
                className="gap-2"
                size="sm"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">تثبيت</span>
              </Button>
              {isAdmin && (
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/admin")}
                  className="gap-2"
                  size="sm"
                >
                  <Shield className="h-4 w-4" />
                  <span className="hidden md:inline">لوحة الأدمن</span>
                </Button>
              )}
              {user?.email && subscribed && (
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-lg">
                  <Crown className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium text-foreground">
                    {user.email}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {!analysisResult ? (
          <div className="space-y-8">
            {/* Subscription Banner */}
            {!subscribed && user && (
              <Card className="p-6 bg-accent/10 border-accent">
                <div className="flex gap-4 items-center">
                  <Crown className="h-8 w-8 text-accent flex-shrink-0" />
                  <div className="flex-1">
                    <h2 className="font-semibold text-foreground mb-2">
                      اشترك للوصول إلى خدمة التحليل
                    </h2>
                    <p className="text-sm text-muted-foreground mb-3">
                      احصل على تحليل شامل ودقيق لمكونات المنتجات الغذائية والتجميلية
                    </p>
                    <Button onClick={() => navigate("/pricing")} className="gap-2">
                      <Crown className="h-4 w-4" />
                      عرض خطط الاشتراك
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Info Banner */}
            <Card className="p-6 bg-primary/5 border-primary/20">
              <div className="flex gap-4">
                <AlertCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div className="space-y-2">
                  <h2 className="font-semibold text-foreground">
                    نظام تحليل علمي شامل
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    نقوم بفحص دقيق لمكونات المنتجات الغذائية والتجميلية استناداً إلى أدلة علمية من هيئات معترف
                    بها مثل FDA و EFSA و EWG. نكشف الأنماط المضللة والمكونات الضارة ونقدم تحليلاً تحوطياً لحماية
                    صحتك وبشرتك.
                  </p>
                </div>
              </div>
            </Card>

            {/* Skin Type Selection - First Step */}
            {!skinType && showSkinTypeSelection ? (
              <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/30">
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">
                      الخطوة الأولى: حدد نوع بشرتك
                    </h2>
                    <p className="text-muted-foreground">
                      سنقدم لك توصيات مخصصة بناءً على نوع بشرتك لتحديد مدى ملاءمة المنتج لك
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(Object.keys(skinTypeConfig) as SkinType[]).map((type) => {
                      const config = skinTypeConfig[type];
                      return (
                        <button
                          key={type}
                          onClick={() => {
                            setSkinType(type);
                            setShowSkinTypeSelection(false);
                            toast.success("تم تحديد نوع البشرة بنجاح! الآن يمكنك تحليل المنتج");
                          }}
                          className={`p-4 rounded-lg border-2 border-border transition-all text-right ${config.color} group`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                              {config.icon}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-foreground mb-1">
                                {config.name}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {config.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card>
            ) : skinType && (
              <Card className="p-4 bg-accent/5 border-accent/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">نوع البشرة المحدد</p>
                      <p className="font-semibold text-foreground">
                        {skinType === 'dry' && 'بشرة جافة'}
                        {skinType === 'oily' && 'بشرة دهنية'}
                        {skinType === 'combination' && 'بشرة مختلطة'}
                        {skinType === 'sensitive' && 'بشرة حساسة'}
                        {skinType === 'normal' && 'بشرة عادية'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowSkinTypeSelection(true);
                      setSkinType(null);
                    }}
                  >
                    تغيير
                  </Button>
                </div>
              </Card>
            )}

            {/* Input Form - Only shown after skin type selection */}
            {skinType && (
            <Card className="p-6 md:p-8">
              <div className="space-y-6">
                {/* Product Type Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    نوع المنتج
                  </label>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant={productType === "food" ? "default" : "outline"}
                      onClick={() => setProductType("food")}
                      className="flex-1"
                    >
                      منتج غذائي
                    </Button>
                    <Button
                      type="button"
                      variant={productType === "cosmetic" ? "default" : "outline"}
                      onClick={() => setProductType("cosmetic")}
                      className="flex-1"
                    >
                      منتج تجميلي
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    اسم المنتج
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="مثال: عصير برتقال طبيعي"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="text-lg flex-1"
                    />
                    {isNative && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleBarcodeScanner}
                        disabled={isScanning}
                        className="shrink-0"
                      >
                        {isScanning ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <ScanLine className="h-5 w-5" />
                        )}
                      </Button>
                    )}
                  </div>
                  {isNative && (
                    <p className="text-xs text-muted-foreground">
                      اضغط على أيقونة المسح لقراءة الباركود تلقائياً
                    </p>
                  )}
                </div>

                {/* Image Upload Section */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    رفع صورة المنتج (اختياري)
                  </label>
                  {!imagePreview ? (
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">انقر لرفع صورة</span> أو اسحب الصورة هنا
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG أو WEBP (حد أقصى 5 ميجابايت)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  ) : (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="معاينة"
                        className="w-full h-60 object-contain rounded-lg border border-border"
                      />
                      <Button
                        onClick={handleRemoveImage}
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 left-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    التقط صورة واضحة لقائمة المكونات على عبوة المنتج
                  </p>
                </div>

                {/* Manual Input (shown only if no image) */}
                {!imageFile && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      أو أدخل المكونات يدوياً
                    </label>
                    <Textarea
                      placeholder="أدخل قائمة المكونات كما هي مكتوبة على المنتج..."
                      value={ingredients}
                      onChange={(e) => setIngredients(e.target.value)}
                      rows={6}
                      className="resize-none text-lg"
                    />
                    <p className="text-xs text-muted-foreground">
                      يمكنك نسخ قائمة المكونات مباشرة من عبوة المنتج
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !subscribed}
                  className="w-full"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                      جاري التحليل...
                    </>
                  ) : !subscribed ? (
                    <>
                      <Crown className="ml-2 h-5 w-5" />
                      يجب الاشتراك للتحليل
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
            )}

            {/* Disclaimer */}
            <Card className="p-4 bg-muted/50">
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                <strong>تنويه:</strong> هذا التحليل لأغراض إعلامية وتعليمية فقط وليس بديلاً
                عن استشارة أخصائي تغذية أو طبيب مؤهل.
              </p>
            </Card>
          </div>
        ) : (
          <AnalysisResults result={analysisResult} skinType={skinType} onReset={handleReset} />
        )}
      </main>
    </div>
  );
};

export default Index;
