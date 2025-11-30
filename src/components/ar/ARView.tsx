import { useEffect, useRef, useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Camera as CameraIcon, Maximize2 } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { HumanBodyModel } from '../visualization/HumanBodyModel';
import { NanoParticles } from '../visualization/NanoParticles';
import * as THREE from 'three';
import { useToast } from '@/hooks/use-toast';

interface Ingredient {
  name: string;
  severity?: string;
  impact?: string;
  benefit?: string;
  concern?: string;
  description?: string;
  affectedOrgan?: string;
}

interface ARViewProps {
  negativeIngredients: Ingredient[];
  positiveIngredients: Ingredient[];
  suspiciousIngredients: Ingredient[];
  onClose: () => void;
}

export const ARView = ({ 
  negativeIngredients, 
  positiveIngredients,
  suspiciousIngredients,
  onClose 
}: ARViewProps) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [selectedOrgan, setSelectedOrgan] = useState<string | null>(null);
  const [bodyPosition, setBodyPosition] = useState<{ x: number; y: number; scale: number }>({
    x: 50,
    y: 50,
    scale: 1
  });

  const affectedOrgans = [
    ...negativeIngredients.map(ing => ing.affectedOrgan || 'face'),
    ...suspiciousIngredients.map(ing => ing.affectedOrgan || 'skin')
  ].filter((organ, index, self) => self.indexOf(organ) === index);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: 'خطأ في الوصول للكاميرا',
        description: 'الرجاء السماح بالوصول للكاميرا لاستخدام وضع AR',
        variant: 'destructive'
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  const handleOrganClick = (organ: string, position: THREE.Vector3) => {
    setSelectedOrgan(organ);
  };

  const getOrganInfo = (organ: string) => {
    const relatedNegative = negativeIngredients.filter(ing => 
      (ing.affectedOrgan || 'face') === organ
    );
    const relatedSuspicious = suspiciousIngredients.filter(ing => 
      (ing.affectedOrgan || 'skin') === organ
    );

    return {
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

  return (
    <div className="fixed inset-0 z-50 bg-background" dir="rtl">
      {/* Camera Feed */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      </div>

      {/* AR Overlay */}
      <div 
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${bodyPosition.x - 50}%, ${bodyPosition.y - 50}%) scale(${bodyPosition.scale})`
        }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-[400px] h-[600px] pointer-events-auto">
            <Canvas>
              <OrbitControls 
                enableZoom={false}
                enablePan={false}
                enableRotate={true}
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
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <Button
          onClick={onClose}
          variant="secondary"
          size="icon"
          className="bg-background/80 backdrop-blur-sm"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Position Controls */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        <Button
          onClick={() => setBodyPosition(prev => ({ ...prev, y: prev.y - 5 }))}
          variant="secondary"
          size="sm"
          className="bg-background/80 backdrop-blur-sm"
        >
          ⬆️ أعلى
        </Button>
        <Button
          onClick={() => setBodyPosition(prev => ({ ...prev, y: prev.y + 5 }))}
          variant="secondary"
          size="sm"
          className="bg-background/80 backdrop-blur-sm"
        >
          ⬇️ أسفل
        </Button>
        <Button
          onClick={() => setBodyPosition(prev => ({ ...prev, x: prev.x - 5 }))}
          variant="secondary"
          size="sm"
          className="bg-background/80 backdrop-blur-sm"
        >
          ⬅️ يسار
        </Button>
        <Button
          onClick={() => setBodyPosition(prev => ({ ...prev, x: prev.x + 5 }))}
          variant="secondary"
          size="sm"
          className="bg-background/80 backdrop-blur-sm"
        >
          ➡️ يمين
        </Button>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        <Button
          onClick={() => setBodyPosition(prev => ({ ...prev, scale: Math.min(prev.scale + 0.1, 2) }))}
          variant="secondary"
          size="sm"
          className="bg-background/80 backdrop-blur-sm"
        >
          <Maximize2 className="h-4 w-4 ml-2" />
          تكبير
        </Button>
        <Button
          onClick={() => setBodyPosition(prev => ({ ...prev, scale: Math.max(prev.scale - 0.1, 0.5) }))}
          variant="secondary"
          size="sm"
          className="bg-background/80 backdrop-blur-sm"
        >
          <Maximize2 className="h-4 w-4 ml-2" />
          تصغير
        </Button>
      </div>

      {/* Organ Info Panel */}
      {selectedOrgan && (
        <Card className="absolute top-20 right-4 w-72 p-4 bg-background/95 backdrop-blur-sm border-primary/20 shadow-xl z-10">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-bold text-primary">
              {selectedOrgan}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedOrgan(null)}
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
          </div>
        </Card>
      )}

      {/* Instructions */}
      <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg p-3 text-sm text-muted-foreground z-10">
        <p>📱 وضع الواقع المعزز نشط</p>
        <p>👆 حرك النموذج لمطابقة جسمك</p>
        <p>🎯 انقر على الأعضاء لعرض التفاصيل</p>
      </div>

      {!cameraActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-20">
          <Card className="p-6 text-center space-y-4">
            <CameraIcon className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-lg font-semibold">جاري تفعيل الكاميرا...</p>
            <p className="text-sm text-muted-foreground">
              الرجاء السماح بالوصول للكاميرا
            </p>
          </Card>
        </div>
      )}
    </div>
  );
};
