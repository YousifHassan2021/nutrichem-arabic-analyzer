import { useState } from "react";
import { ArrowRight, FileText, CheckCircle, CreditCard, AlertTriangle, Shield, RefreshCw, Mail, Globe, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

const TermsOfUse = () => {
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
              <FileText className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {language === "ar" ? "شروط الاستخدام" : "Terms of Use"}
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
            {/* Acceptance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  1. القبول
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed">
                <p className="mb-4">
                  باستخدامك لتطبيق ماعون، فإنك توافق على شروط الاستخدام هذه، إضافة إلى شروط Apple القياسية (Apple Standard EULA):
                </p>
                <a 
                  href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <ExternalLink size={16} />
                  Apple Standard EULA
                </a>
              </CardContent>
            </Card>

            {/* Service Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  2. وصف الخدمة
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed">
                <p className="mb-4">
                  يوفر تطبيق ماعون تحليلاً ذكيًا لمكونات المنتجات الغذائية أو التجميلية اعتمادًا على الصور أو المعلومات المدخلة، وذلك لأغراض معلوماتية فقط.
                </p>
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="flex items-start gap-2 text-destructive">
                    <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>
                      لا يُعد هذا التحليل تشخيصًا طبيًا أو صحيًا، ولا يُغني عن استشارة مختص.
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Subscriptions and Payment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  3. الاشتراكات والدفع
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed">
                <ul className="list-disc list-inside space-y-2">
                  <li>يقدم تطبيق ماعون اشتراكات مدفوعة بميزات إضافية</li>
                  <li>الاشتراك يتجدد تلقائيًا ما لم يتم إلغاؤه</li>
                  <li>يمكن للمستخدم إدارة أو إلغاء الاشتراك من إعدادات Apple ID</li>
                  <li>تتم جميع عمليات الدفع عبر Apple فقط</li>
                </ul>
              </CardContent>
            </Card>

            {/* Liability Limits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  4. حدود المسؤولية
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed">
                <ul className="list-disc list-inside space-y-2">
                  <li>تعتمد نتائج التحليل على جودة المعلومات أو الصور المقدمة</li>
                  <li>لا يتحمل تطبيق ماعون أي مسؤولية عن القرارات المتخذة بناءً على التحليل</li>
                  <li>الاستخدام يكون على مسؤولية المستخدم الشخصية</li>
                </ul>
              </CardContent>
            </Card>

            {/* Intellectual Property */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  5. الملكية الفكرية
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed">
                <p>
                  جميع الحقوق المتعلقة بالمحتوى، التصميم، والتقنيات المستخدمة في تطبيق ماعون محفوظة، ولا يجوز إعادة استخدامها دون إذن مسبق.
                </p>
              </CardContent>
            </Card>

            {/* Termination */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  6. إنهاء الاستخدام
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed">
                <p>
                  يحتفظ تطبيق ماعون بالحق في تعليق أو إنهاء الحساب في حال إساءة الاستخدام أو مخالفة الشروط.
                </p>
              </CardContent>
            </Card>

            {/* Changes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-primary" />
                  7. التعديلات على الشروط
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed">
                <p>
                  قد يتم تحديث شروط الاستخدام في أي وقت، ويُعد استمرار استخدام التطبيق موافقة على التعديلات.
                </p>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  8. التواصل
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed">
                <p className="text-primary font-semibold">📧 support@maounapp.com</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Acceptance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  1. Acceptance
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed">
                <p className="mb-4">
                  By using the Maoun app, you agree to these Terms of Use, in addition to Apple's Standard EULA:
                </p>
                <a 
                  href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <ExternalLink size={16} />
                  Apple Standard EULA
                </a>
              </CardContent>
            </Card>

            {/* Service Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  2. Service Description
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed">
                <p className="mb-4">
                  Maoun app provides intelligent analysis of food or cosmetic product ingredients based on images or input information, for informational purposes only.
                </p>
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="flex items-start gap-2 text-destructive">
                    <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>
                      This analysis is not a medical or health diagnosis and does not replace consulting a specialist.
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Subscriptions and Payment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  3. Subscriptions and Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed">
                <ul className="list-disc list-inside space-y-2">
                  <li>Maoun app offers paid subscriptions with additional features</li>
                  <li>Subscriptions renew automatically unless canceled</li>
                  <li>Users can manage or cancel subscriptions from Apple ID settings</li>
                  <li>All payments are processed through Apple only</li>
                </ul>
              </CardContent>
            </Card>

            {/* Liability Limits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  4. Liability Limits
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed">
                <ul className="list-disc list-inside space-y-2">
                  <li>Analysis results depend on the quality of information or images provided</li>
                  <li>Maoun app bears no responsibility for decisions made based on the analysis</li>
                  <li>Usage is at the user's own risk</li>
                </ul>
              </CardContent>
            </Card>

            {/* Intellectual Property */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  5. Intellectual Property
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed">
                <p>
                  All rights related to content, design, and technologies used in Maoun app are reserved and may not be reused without prior permission.
                </p>
              </CardContent>
            </Card>

            {/* Termination */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  6. Termination of Use
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed">
                <p>
                  Maoun app reserves the right to suspend or terminate accounts in case of misuse or violation of terms.
                </p>
              </CardContent>
            </Card>

            {/* Changes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-primary" />
                  7. Changes to Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed">
                <p>
                  Terms of Use may be updated at any time, and continued use of the app constitutes acceptance of the modifications.
                </p>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  8. Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed">
                <p className="text-primary font-semibold">📧 support@maounapp.com</p>
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

export default TermsOfUse;
