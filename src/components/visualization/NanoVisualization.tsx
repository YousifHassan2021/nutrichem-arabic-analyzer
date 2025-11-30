import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { HumanBodyModel } from './HumanBodyModel';
import { NanoParticles } from './NanoParticles';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useState } from 'react';
import * as THREE from 'three';

interface Ingredient {
  name: string;
  severity?: string;
  impact?: string;
  benefit?: string;
  concern?: string;
  description?: string;
  affectedOrgan?: string;
}

interface NanoVisualizationProps {
  negativeIngredients: Ingredient[];
  positiveIngredients: Ingredient[];
  suspiciousIngredients: Ingredient[];
}

interface OrganInfo {
  name: string;
  arabicName: string;
  ingredients: string[];
  effects: string[];
  advice: string;
}

const organInfoMap: Record<string, OrganInfo> = {
  face: {
    name: 'face',
    arabicName: 'الوجه',
    ingredients: [],
    effects: [],
    advice: 'تجنب ملامسة العينين والفم. اغسل الوجه جيداً بعد الاستخدام.'
  },
  skin: {
    name: 'skin',
    arabicName: 'الجلد',
    ingredients: [],
    effects: [],
    advice: 'قد يسبب تهيج الجلد على المدى الطويق. استخدم مرطب بعد الاستخدام.'
  },
  liver: {
    name: 'liver',
    arabicName: 'الكبد',
    ingredients: [],
    effects: [],
    advice: 'قد تتراكم هذه المواد في الكبد. تجنب الاستخدام المفرط.'
  },
  kidneys: {
    name: 'kidneys',
    arabicName: 'الكلى',
    ingredients: [],
    effects: [],
    advice: 'اشرب كمية كافية من الماء. راجع الطبيب في حال ظهور أعراض.'
  },
  stomach: {
    name: 'stomach',
    arabicName: 'المعدة',
    ingredients: [],
    effects: [],
    advice: 'قد يسبب اضطرابات هضمية. تجنب تناول المنتج على معدة فارغة.'
  },
  head: {
    name: 'head',
    arabicName: 'الرأس',
    ingredients: [],
    effects: [],
    advice: 'قد يسبب صداع أو دوار. توقف عن الاستخدام في حال ظهور أعراض.'
  },
  torso: {
    name: 'torso',
    arabicName: 'الجذع',
    ingredients: [],
    effects: [],
    advice: 'تأكد من اتباع التعليمات الموجودة على العبوة.'
  }
};

export const NanoVisualization = ({ 
  negativeIngredients, 
  positiveIngredients,
  suspiciousIngredients 
}: NanoVisualizationProps) => {
  const [selectedOrgan, setSelectedOrgan] = useState<string | null>(null);
  const [organPosition, setOrganPosition] = useState<THREE.Vector3 | null>(null);

  // Determine affected organs based on ingredients
  const affectedOrgans = [
    ...negativeIngredients.map(ing => ing.affectedOrgan || 'face'),
    ...suspiciousIngredients.map(ing => ing.affectedOrgan || 'skin')
  ].filter((organ, index, self) => self.indexOf(organ) === index);

  // Build organ info with actual ingredients
  const getOrganInfo = (organ: string): OrganInfo => {
    const baseInfo = organInfoMap[organ] || organInfoMap.face;
    const relatedNegative = negativeIngredients.filter(ing => 
      (ing.affectedOrgan || 'face') === organ
    );
    const relatedSuspicious = suspiciousIngredients.filter(ing => 
      (ing.affectedOrgan || 'skin') === organ
    );

    return {
      ...baseInfo,
      ingredients: [
        ...relatedNegative.map(ing => ing.name),
        ...relatedSuspicious.map(ing => ing.name)
      ],
      effects: [
        ...relatedNegative.map(ing => ing.impact || 'تأثير سلبي محتمل'),
        ...relatedSuspicious.map(ing => ing.impact || 'تأثير غير واضح')
      ]
    };
  };

  const handleOrganClick = (organ: string, position: THREE.Vector3) => {
    setSelectedOrgan(organ);
    setOrganPosition(position);
  };

  const handleCloseInfo = () => {
    setSelectedOrgan(null);
    setOrganPosition(null);
  };

  return (
    <div className="relative w-full h-[600px] bg-gradient-to-b from-background to-muted rounded-lg overflow-hidden">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 2, 5]} />
        <OrbitControls 
          enableZoom={true}
          enablePan={false}
          minDistance={3}
          maxDistance={8}
          maxPolarAngle={Math.PI / 1.5}
        />
        
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, 10, -5]} intensity={0.5} />
        <pointLight position={[0, 5, 0]} intensity={0.5} color="#4a90e2" />
        
        <HumanBodyModel 
          affectedOrgans={affectedOrgans}
          onOrganClick={handleOrganClick}
        />
        
        {affectedOrgans.length > 0 && (
          <NanoParticles 
            negative={negativeIngredients.length}
            positive={positiveIngredients.length}
            targetOrgan={affectedOrgans[0]}
          />
        )}
      </Canvas>

      {/* Info Panel */}
      {selectedOrgan && (
        <Card className="absolute top-4 right-4 w-80 p-4 bg-background/95 backdrop-blur-sm border-primary/20 shadow-xl">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-bold text-primary">
              {getOrganInfo(selectedOrgan).arabicName}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCloseInfo}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {getOrganInfo(selectedOrgan).ingredients.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">
                  المواد المؤثرة:
                </p>
                <ul className="text-sm space-y-1">
                  {getOrganInfo(selectedOrgan).ingredients.map((ing, i) => (
                    <li key={i} className="text-destructive">• {ing}</li>
                  ))}
                </ul>
              </div>
            )}

            {getOrganInfo(selectedOrgan).effects.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">
                  التأثيرات:
                </p>
                <ul className="text-sm space-y-1">
                  {getOrganInfo(selectedOrgan).effects.map((effect, i) => (
                    <li key={i} className="text-foreground">• {effect}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-2 border-t border-border">
              <p className="text-sm font-semibold text-primary mb-1">
                نصيحة:
              </p>
              <p className="text-sm text-muted-foreground">
                {getOrganInfo(selectedOrgan).advice}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg p-3 text-sm text-muted-foreground">
        <p>🖱️ اسحب للدوران • 🔍 استخدم عجلة الماوس للتكبير</p>
        <p>👆 انقر على أي عضو لعرض التفاصيل</p>
      </div>
    </div>
  );
};
