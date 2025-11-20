import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Beaker, AlertCircle, Upload, X, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AnalysisResults from "@/components/AnalysisResults";
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';

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

const Index = () => {
  const [productName, setProductName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const isNative = Capacitor.isNativePlatform();

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
      const body: any = { productName };
      
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
                  disabled={isAnalyzing}
                  className="w-full"
                  size="lg"
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
