import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Camera as CameraIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FaceDetection } from '@mediapipe/face_detection';

interface Ingredient {
  name: string;
  severity?: string;
  impact?: string;
  benefit?: string;
  concern?: string;
  description?: string;
  affectedOrgan?: string;
}

interface FaceARViewProps {
  negativeIngredients: Ingredient[];
  positiveIngredients: Ingredient[];
  suspiciousIngredients: Ingredient[];
  onClose: () => void;
}

interface FaceZone {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  effects: Array<{
    ingredient: string;
    type: 'negative' | 'positive';
    description: string;
  }>;
}

export const FaceARView = ({ 
  negativeIngredients, 
  positiveIngredients,
  suspiciousIngredients,
  onClose 
}: FaceARViewProps) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceZones, setFaceZones] = useState<FaceZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<FaceZone | null>(null);
  const faceDetectionRef = useRef<FaceDetection | null>(null);

  useEffect(() => {
    initializeFaceDetection();
    return () => {
      cleanup();
    };
  }, []);

  const initializeFaceDetection = async () => {
    try {
      // Request camera permission first
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current?.play();
            setCameraActive(true);

            // Initialize MediaPipe Face Detection after camera is ready
            const faceDetection = new FaceDetection({
              locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
              }
            });

            faceDetection.setOptions({
              model: 'short',
              minDetectionConfidence: 0.5
            });

            faceDetection.onResults(onFaceDetectionResults);
            faceDetectionRef.current = faceDetection;

            // Start processing frames
            const processFrame = async () => {
              if (videoRef.current && faceDetectionRef.current && videoRef.current.readyState === 4) {
                try {
                  await faceDetectionRef.current.send({ image: videoRef.current });
                } catch (err) {
                  console.error('Frame processing error:', err);
                }
              }
              requestAnimationFrame(processFrame);
            };
            processFrame();
          } catch (playError) {
            console.error('Video play error:', playError);
            throw playError;
          }
        };
      }
    } catch (error: any) {
      console.error('Error initializing face detection:', error);
      let errorMessage = 'حدث خطأ غير متوقع';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'الرجاء السماح بالوصول للكاميرا من إعدادات المتصفح';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'لم يتم العثور على كاميرا متاحة';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'الكاميرا قيد الاستخدام من تطبيق آخر';
      } else if (error.message === 'Camera not supported') {
        errorMessage = 'متصفحك لا يدعم الوصول للكاميرا';
      }

      toast({
        title: 'خطأ في تهيئة التعرف على الوجه',
        description: errorMessage,
        variant: 'destructive'
      });
      
      onClose();
    }
  };

  const onFaceDetectionResults = (results: any) => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.detections && results.detections.length > 0) {
      setFaceDetected(true);
      const detection = results.detections[0];
      
      // Calculate face zones based on face landmarks
      const bbox = detection.boundingBox;
      const x = bbox.xCenter * canvas.width - (bbox.width * canvas.width) / 2;
      const y = bbox.yCenter * canvas.height - (bbox.height * canvas.height) / 2;
      const width = bbox.width * canvas.width;
      const height = bbox.height * canvas.height;

      // Define face zones for cosmetic effects
      const zones = calculateFaceZones(x, y, width, height);
      setFaceZones(zones);

      // Draw effects on face
      drawFaceEffects(ctx, zones);
    } else {
      setFaceDetected(false);
      setFaceZones([]);
    }
  };

  const calculateFaceZones = (x: number, y: number, width: number, height: number): FaceZone[] => {
    const zones: FaceZone[] = [];

    // Forehead zone (for irritation effects)
    const foreheadEffects = negativeIngredients
      .filter(ing => ing.description?.includes('تهيج') || ing.description?.includes('حساسية'))
      .map(ing => ({
        ingredient: ing.name,
        type: 'negative' as const,
        description: ing.impact || 'قد يسبب تهيج البشرة'
      }));

    if (foreheadEffects.length > 0) {
      zones.push({
        name: 'الجبهة',
        x: x,
        y: y,
        width: width,
        height: height * 0.3,
        effects: foreheadEffects
      });
    }

    // Cheeks zone (for hydration/dryness effects)
    const cheeksEffects = [
      ...negativeIngredients
        .filter(ing => ing.description?.includes('جفاف'))
        .map(ing => ({
          ingredient: ing.name,
          type: 'negative' as const,
          description: ing.impact || 'قد يسبب جفاف البشرة'
        })),
      ...positiveIngredients
        .filter(ing => ing.description?.includes('ترطيب') || ing.description?.includes('نضارة'))
        .map(ing => ({
          ingredient: ing.name,
          type: 'positive' as const,
          description: ing.benefit || 'يساعد على ترطيب البشرة'
        }))
    ];

    if (cheeksEffects.length > 0) {
      zones.push({
        name: 'الخدود',
        x: x,
        y: y + height * 0.3,
        width: width,
        height: height * 0.4,
        effects: cheeksEffects
      });
    }

    // T-zone (for pores/oil control)
    const tZoneEffects = [
      ...negativeIngredients
        .filter(ing => ing.description?.includes('مسام') || ing.description?.includes('دهني'))
        .map(ing => ({
          ingredient: ing.name,
          type: 'negative' as const,
          description: ing.impact || 'قد يؤثر على المسام'
        })),
      ...positiveIngredients
        .filter(ing => ing.description?.includes('مسام') || ing.description?.includes('تنظيف'))
        .map(ing => ({
          ingredient: ing.name,
          type: 'positive' as const,
          description: ing.benefit || 'يساعد على تضييق المسام'
        }))
    ];

    if (tZoneEffects.length > 0) {
      zones.push({
        name: 'منطقة T',
        x: x + width * 0.3,
        y: y + height * 0.2,
        width: width * 0.4,
        height: height * 0.5,
        effects: tZoneEffects
      });
    }

    return zones;
  };

  const drawFaceEffects = (ctx: CanvasRenderingContext2D, zones: FaceZone[]) => {
    zones.forEach(zone => {
      const hasNegative = zone.effects.some(e => e.type === 'negative');
      const hasPositive = zone.effects.some(e => e.type === 'positive');

      // Draw semi-transparent overlay
      if (hasNegative) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'; // Red for negative
        ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
        
        // Add pulsing border
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 3;
        ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
      }

      if (hasPositive) {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.2)'; // Green for positive
        ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
        
        // Add glowing effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(34, 197, 94, 0.8)';
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
        ctx.lineWidth = 2;
        ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
        ctx.shadowBlur = 0;
      }

      // Draw arrows pointing to affected areas
      if (hasNegative || hasPositive) {
        const arrowX = zone.x + zone.width / 2;
        const arrowY = zone.y - 20;
        
        ctx.fillStyle = hasNegative ? '#ef4444' : '#22c55e';
        ctx.font = '24px Arial';
        ctx.fillText('↓', arrowX - 8, arrowY);
      }

      // Make zone clickable visually
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
      ctx.globalAlpha = 1.0;
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Find clicked zone
    const clickedZone = faceZones.find(zone => 
      clickX >= zone.x && 
      clickX <= zone.x + zone.width &&
      clickY >= zone.y && 
      clickY <= zone.y + zone.height
    );

    if (clickedZone) {
      setSelectedZone(clickedZone);
    }
  };

  const cleanup = () => {
    // Stop video stream
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    // Close face detection
    if (faceDetectionRef.current) {
      faceDetectionRef.current.close();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background" dir="rtl">
      {/* Video and Canvas Container */}
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            style={{ transform: 'scaleX(-1)' }} // Mirror effect
          />
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="absolute inset-0 w-full h-full object-cover cursor-pointer"
            style={{ transform: 'scaleX(-1)' }} // Mirror effect
          />
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

      {/* Status Badge */}
      <div className="absolute top-4 left-4 z-10">
        <Badge 
          variant={faceDetected ? "default" : "secondary"}
          className={`${faceDetected ? 'bg-success' : 'bg-muted'} text-white px-4 py-2`}
        >
          {faceDetected ? '✓ تم رصد الوجه' : '⚠️ لم يتم رصد الوجه'}
        </Badge>
      </div>

      {/* Zone Info Panel */}
      {selectedZone && (
        <Card className="absolute top-20 right-4 w-80 p-4 bg-background/95 backdrop-blur-sm border-primary/20 shadow-xl z-10 max-h-[60vh] overflow-y-auto">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-bold text-primary">
              {selectedZone.name}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedZone(null)}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {selectedZone.effects.map((effect, i) => (
              <div 
                key={i}
                className={`p-3 rounded-lg border ${
                  effect.type === 'negative' 
                    ? 'bg-destructive/10 border-destructive/20' 
                    : 'bg-success/10 border-success/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-lg ${effect.type === 'negative' ? 'text-destructive' : 'text-success'}`}>
                    {effect.type === 'negative' ? '⚠️' : '✓'}
                  </span>
                  <span className="font-semibold text-foreground">{effect.ingredient}</span>
                </div>
                <p className="text-sm text-muted-foreground">{effect.description}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-sm rounded-lg p-4 text-sm text-center z-10 max-w-md">
        <p className="font-semibold text-foreground mb-2">📱 معاينة التأثير على الوجه</p>
        <p className="text-muted-foreground text-xs">
          {faceDetected 
            ? '✓ وجه للكاميرا وانقر على المناطق الملونة لعرض التفاصيل' 
            : 'الرجاء وضع وجهك أمام الكاميرا'}
        </p>
        <div className="flex items-center justify-center gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-destructive rounded-full"></div>
            <span>تأثير سلبي</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-success rounded-full"></div>
            <span>تأثير إيجابي</span>
          </div>
        </div>
      </div>

      {!cameraActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-20">
          <Card className="p-6 text-center space-y-4">
            <CameraIcon className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-lg font-semibold">جاري تفعيل الكاميرا والتعرف على الوجه...</p>
            <p className="text-sm text-muted-foreground">
              الرجاء السماح بالوصول للكاميرا
            </p>
          </Card>
        </div>
      )}
    </div>
  );
};
