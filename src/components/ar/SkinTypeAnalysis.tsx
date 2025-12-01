import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Droplets, Sparkles, Sun, Wind } from 'lucide-react';

interface SkinTypeAnalysisProps {
  onClose: () => void;
  onSkinTypeSelected: (skinType: string) => void;
}

type SkinType = 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal';

const skinTypes: Record<SkinType, {
  name: string;
  icon: React.ReactNode;
  description: string;
  characteristics: string[];
  color: string;
}> = {
  dry: {
    name: 'جافة',
    icon: <Wind className="h-6 w-6" />,
    description: 'بشرة تفتقر إلى الرطوبة وتحتاج إلى عناية خاصة',
    characteristics: [
      'شعور بالشد بعد الغسيل',
      'تقشر خفيف أو خشونة',
      'مسام صغيرة غير مرئية تقريباً',
      'خطوط دقيقة واضحة'
    ],
    color: 'bg-blue-500/20 border-blue-500/30'
  },
  oily: {
    name: 'دهنية',
    icon: <Droplets className="h-6 w-6" />,
    description: 'بشرة تنتج الزيوت بكثرة خاصة في منطقة T',
    characteristics: [
      'لمعان واضح على البشرة',
      'مسام واسعة ومرئية',
      'عرضة لظهور الحبوب',
      'المكياج لا يثبت طويلاً'
    ],
    color: 'bg-amber-500/20 border-amber-500/30'
  },
  combination: {
    name: 'مختلطة',
    icon: <Sun className="h-6 w-6" />,
    description: 'دهنية في منطقة T وجافة أو طبيعية في الخدود',
    characteristics: [
      'دهنية على الجبهة والأنف',
      'جافة أو طبيعية على الخدود',
      'مسام متوسطة الحجم',
      'قد تظهر حبوب في منطقة T'
    ],
    color: 'bg-purple-500/20 border-purple-500/30'
  },
  sensitive: {
    name: 'حساسة',
    icon: <Sparkles className="h-6 w-6" />,
    description: 'بشرة تتفاعل بسهولة مع المنتجات والعوامل الخارجية',
    characteristics: [
      'احمرار متكرر',
      'حكة أو حرقة عند استخدام منتجات معينة',
      'تهيج سريع',
      'ردود فعل تحسسية'
    ],
    color: 'bg-red-500/20 border-red-500/30'
  },
  normal: {
    name: 'طبيعية',
    icon: <Sparkles className="h-6 w-6" />,
    description: 'بشرة متوازنة غير دهنية ولا جافة',
    characteristics: [
      'ملمس ناعم ومتوازن',
      'مسام صغيرة غير واضحة',
      'لا تعاني من مشاكل كبيرة',
      'لون موحد وصحي'
    ],
    color: 'bg-green-500/20 border-green-500/30'
  }
};

export const SkinTypeAnalysis = ({ onClose, onSkinTypeSelected }: SkinTypeAnalysisProps) => {
  const [selectedType, setSelectedType] = useState<SkinType | null>(null);

  const handleSelect = (type: SkinType) => {
    setSelectedType(type);
  };

  const handleConfirm = () => {
    if (selectedType) {
      onSkinTypeSelected(selectedType);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm" dir="rtl">
      <div className="container max-w-4xl mx-auto p-4 h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-6 mt-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">تحليل نوع البشرة</h2>
            <p className="text-sm text-muted-foreground mt-1">
              اختر نوع بشرتك للحصول على توصيات مخصصة
            </p>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid gap-4 mb-6">
          {(Object.keys(skinTypes) as SkinType[]).map((type) => {
            const skinType = skinTypes[type];
            const isSelected = selectedType === type;

            return (
              <Card
                key={type}
                className={`p-4 cursor-pointer transition-all border-2 ${
                  isSelected
                    ? 'border-primary shadow-lg scale-[1.02]'
                    : 'border-border hover:border-primary/50'
                } ${skinType.color}`}
                onClick={() => handleSelect(type)}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {skinType.icon}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-foreground">
                        {skinType.name}
                      </h3>
                      {isSelected && (
                        <Badge variant="default" className="bg-primary">
                          ✓ محدد
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {skinType.description}
                    </p>

                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-foreground mb-1">
                        المواصفات:
                      </p>
                      {skinType.characteristics.map((char, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{char}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {selectedType && (
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 -mx-4">
            <Button
              onClick={handleConfirm}
              className="w-full"
              size="lg"
            >
              تأكيد نوع البشرة: {skinTypes[selectedType].name}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
