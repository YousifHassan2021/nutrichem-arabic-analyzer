import { useState } from "react";
import { ArrowRight, Shield, Lock, Eye, Database, Trash2, Mail, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<"ar" | "en">("ar");

  const lastUpdated = "2025-01-08";

  return (
    <div className="min-h-screen bg-background" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="bg-primary/10 border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <ArrowRight className={language === "ar" ? "" : "rotate-180"} size={20} />
              {language === "ar" ? "العودة للرئيسية" : "Back to Home"}
            </Button>
            
            <Tabs value={language} onValueChange={(v) => setLanguage(v as "ar" | "en")}>
              <TabsList>
                <TabsTrigger value="ar" className="flex items-center gap-2">
                  <Globe size={16} />
                  العربية
                </TabsTrigger>
                <TabsTrigger value="en" className="flex items-center gap-2">
                  <Globe size={16} />
                  English
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Shield className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {language === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}
          </h1>
          <p className="text-muted-foreground">
            {language === "ar" ? "تطبيق ماعون - محلل المكونات الذكي" : "Maoun App - Smart Ingredient Analyzer"}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {language === "ar" ? `آخر تحديث: ${lastUpdated}` : `Last Updated: ${lastUpdated}`}
          </p>
        </div>

        {language === "ar" ? (
          <div className="space-y-6">
            {/* Introduction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  مقدمة
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed">
                <p>
                  مرحباً بكم في تطبيق "ماعون". نحن نقدر خصوصيتكم ونلتزم بحماية بياناتكم الشخصية. 
                  توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية المعلومات التي تقدمونها عند استخدام تطبيقنا.
                </p>
              </CardContent>
            </Card>

            {/* Data Collection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  البيانات التي نجمعها
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">معلومات الجهاز:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>معرّف الجهاز الفريد (UUID) لإدارة الاشتراكات</li>
                    <li>نوع الجهاز ونظام التشغيل</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">معلومات الاشتراك:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>البريد الإلكتروني (عند الاشتراك)</li>
                    <li>حالة الاشتراك وتاريخ الانتهاء</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">الصور المرفوعة:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>صور المنتجات التي ترفعها للتحليل</li>
                    <li>لا يتم تخزين الصور بشكل دائم - تُستخدم فقط للتحليل ثم تُحذف</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Data Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  كيف نستخدم بياناتكم
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed">
                <ul className="list-disc list-inside space-y-2">
                  <li>تحليل مكونات المنتجات وتقديم نتائج مخصصة</li>
                  <li>إدارة اشتراككم وتفعيله على جهازكم</li>
                  <li>تحسين خدماتنا وتجربة المستخدم</li>
                  <li>التواصل معكم بخصوص حالة الاشتراك</li>
                </ul>
              </CardContent>
            </Card>

            {/* Data Protection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  حماية البيانات
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed">
                <ul className="list-disc list-inside space-y-2">
                  <li>نستخدم تشفير SSL/TLS لحماية البيانات أثناء النقل</li>
                  <li>بياناتكم مخزنة على خوادم آمنة</li>
                  <li>لا نشارك بياناتكم مع أطراف ثالثة لأغراض تسويقية</li>
                  <li>نحتفظ بالبيانات فقط للمدة اللازمة لتقديم الخدمة</li>
                </ul>
              </CardContent>
            </Card>

            {/* User Rights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-primary" />
                  حقوقكم
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed">
                <ul className="list-disc list-inside space-y-2">
                  <li>حق الوصول إلى بياناتكم الشخصية</li>
                  <li>حق تصحيح البيانات غير الدقيقة</li>
                  <li>حق حذف بياناتكم (حق النسيان)</li>
                  <li>حق الاعتراض على معالجة البيانات</li>
                  <li>حق نقل البيانات</li>
                </ul>
              </CardContent>
            </Card>

            {/* Third Party Services */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  خدمات الطرف الثالث
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed">
                <p className="mb-4">نستخدم الخدمات التالية:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Stripe:</strong> لمعالجة المدفوعات بشكل آمن</li>
                  <li><strong>خدمات الذكاء الاصطناعي:</strong> لتحليل مكونات المنتجات</li>
                </ul>
                <p className="mt-4">
                  كل خدمة من هذه الخدمات لها سياسة خصوصية خاصة بها ننصحكم بمراجعتها.
                </p>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  اتصل بنا
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed">
                <p>
                  إذا كانت لديكم أي أسئلة حول سياسة الخصوصية أو ترغبون في ممارسة حقوقكم، 
                  يرجى التواصل معنا عبر البريد الإلكتروني:
                </p>
                <p className="mt-2 text-primary font-semibold">support@maoun.app</p>
              </CardContent>
            </Card>

            {/* Changes */}
            <Card>
              <CardContent className="text-muted-foreground leading-relaxed py-6">
                <p>
                  قد نقوم بتحديث سياسة الخصوصية من وقت لآخر. سنخطركم بأي تغييرات جوهرية 
                  عبر التطبيق أو البريد الإلكتروني.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Introduction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Introduction
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed">
                <p>
                  Welcome to Maoun App. We value your privacy and are committed to protecting your personal data. 
                  This Privacy Policy explains how we collect, use, and protect the information you provide when using our app.
                </p>
              </CardContent>
            </Card>

            {/* Data Collection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  Data We Collect
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Device Information:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Unique device identifier (UUID) for subscription management</li>
                    <li>Device type and operating system</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Subscription Information:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Email address (when subscribing)</li>
                    <li>Subscription status and expiration date</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Uploaded Images:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Product images you upload for analysis</li>
                    <li>Images are not stored permanently - used only for analysis then deleted</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Data Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  How We Use Your Data
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed">
                <ul className="list-disc list-inside space-y-2">
                  <li>Analyze product ingredients and provide personalized results</li>
                  <li>Manage and activate your subscription on your device</li>
                  <li>Improve our services and user experience</li>
                  <li>Communicate with you regarding subscription status</li>
                </ul>
              </CardContent>
            </Card>

            {/* Data Protection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  Data Protection
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed">
                <ul className="list-disc list-inside space-y-2">
                  <li>We use SSL/TLS encryption to protect data in transit</li>
                  <li>Your data is stored on secure servers</li>
                  <li>We do not share your data with third parties for marketing purposes</li>
                  <li>We retain data only for as long as necessary to provide the service</li>
                </ul>
              </CardContent>
            </Card>

            {/* User Rights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-primary" />
                  Your Rights
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed">
                <ul className="list-disc list-inside space-y-2">
                  <li>Right to access your personal data</li>
                  <li>Right to rectify inaccurate data</li>
                  <li>Right to erasure (right to be forgotten)</li>
                  <li>Right to object to data processing</li>
                  <li>Right to data portability</li>
                </ul>
              </CardContent>
            </Card>

            {/* Third Party Services */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Third-Party Services
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed">
                <p className="mb-4">We use the following services:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Stripe:</strong> For secure payment processing</li>
                  <li><strong>AI Services:</strong> For analyzing product ingredients</li>
                </ul>
                <p className="mt-4">
                  Each of these services has its own privacy policy that we recommend you review.
                </p>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  Contact Us
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed">
                <p>
                  If you have any questions about this Privacy Policy or wish to exercise your rights, 
                  please contact us via email:
                </p>
                <p className="mt-2 text-primary font-semibold">support@maoun.app</p>
              </CardContent>
            </Card>

            {/* Changes */}
            <Card>
              <CardContent className="text-muted-foreground leading-relaxed py-6">
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any significant changes 
                  through the app or via email.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 pt-8 border-t border-border">
          <p className="text-muted-foreground text-sm">
            {language === "ar" 
              ? "© 2025 ماعون - جميع الحقوق محفوظة" 
              : "© 2025 Maoun - All Rights Reserved"}
          </p>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
