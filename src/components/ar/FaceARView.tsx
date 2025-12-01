import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Camera as CameraIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// MediaPipe Tasks Vision will be loaded dynamically in the browser

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
  const faceDetectionRef = useRef<any | null>(null);

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
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current?.play();
            setCameraActive(true);

            // Initialize MediaPipe Tasks Vision FaceLandmarker (better mobile support)
            console.log('Face AR - initializing FaceLandmarker');
            // @ts-ignore - URL-based dynamic import not known to TypeScript
            const visionModule = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3');
            const { FaceLandmarker, FilesetResolver } = visionModule;

            const vision = await FilesetResolver.forVisionTasks(
              'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
            );

            faceDetectionRef.current = await FaceLandmarker.createFromOptions(vision, {
              baseOptions: {
                modelAssetPath:
                  'https://storage.googleapis.com/mediapipe-assets/face_landmarker.task',
              },
              runningMode: 'VIDEO',
              numFaces: 1,
            });

            // Start processing frames with FaceLandmarker
            const processFrame = async () => {
              if (videoRef.current && faceDetectionRef.current && videoRef.current.readyState === 4) {
                try {
                  const nowInMs = performance.now();
                  const results = await faceDetectionRef.current.detectForVideo(
                    videoRef.current,
                    nowInMs
                  );
                  onFaceDetectionResults(results);
                } catch (err) {
                  console.error('Face AR - frame processing error (FaceLandmarker):', err);
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
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video actual dimensions
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    if (videoWidth === 0 || videoHeight === 0) return;
    
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1) Prefer MediaPipe Tasks Vision FaceLandmarker results (faceLandmarks)
    const faceLandmarks = results?.faceLandmarks?.[0];
    if (faceLandmarks && Array.isArray(faceLandmarks) && faceLandmarks.length > 0) {
      let minX = 1;
      let minY = 1;
      let maxX = 0;
      let maxY = 0;

      for (const pt of faceLandmarks) {
        if (typeof pt.x !== 'number' || typeof pt.y !== 'number') continue;
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;
      }

      const x = minX * canvas.width;
      const y = minY * canvas.height;
      const width = (maxX - minX) * canvas.width;
      const height = (maxY - minY) * canvas.height;

      if (!isFinite(x) || !isFinite(y) || !isFinite(width) || !isFinite(height) || width <= 0 || height <= 0) {
        console.warn('Face AR - invalid faceLandmarker bounding box', { x, y, width, height });
        setFaceDetected(false);
        setFaceZones([]);
        return;
      }

      setFaceDetected(true);
      const zones = calculateFaceZones(x, y, width, height);
      setFaceZones(zones);
      drawFaceEffects(ctx, zones);
      return;
    }

    // 2) Fallback: MediaPipe قد تُرجع الحقول بأسماء مختلفة حسب الإصدار القديم
    const detections =
      results?.detections ||
      results?.faceDetections ||
      results?.multiFaceDetections ||
      [];

    const hasDetections = Array.isArray(detections) && detections.length > 0;
    console.log('Face AR - detections', {
      hasDetections,
      count: hasDetections ? detections.length : 0,
    });

    if (hasDetections) {
      setFaceDetected(true);
      const detection: any = detections[0];

      // Calculate face bounding box (ندعم أكثر من شكل للبيانات)
      let x = 0;
      let y = 0;
      let width = canvas.width;
      let height = canvas.height;

      if (detection.boundingBox) {
        const bbox = detection.boundingBox;
        // قيم MediaPipe هنا تكون عادةً كنسب من العرض/الارتفاع
        x = bbox.xCenter * canvas.width - (bbox.width * canvas.width) / 2;
        y = bbox.yCenter * canvas.height - (bbox.height * canvas.height) / 2;
        width = bbox.width * canvas.width;
        height = bbox.height * canvas.height;
      } else if (detection.locationData?.relativeBoundingBox) {
        const rb = detection.locationData.relativeBoundingBox;
        x = rb.xmin * canvas.width;
        y = rb.ymin * canvas.height;
        width = rb.width * canvas.width;
        height = rb.height * canvas.height;
      } else {
        console.warn('Face AR - no bounding box on detection', detection);
        setFaceDetected(false);
        setFaceZones([]);
        return;
      }

      // تأكد من أن الأبعاد منطقية قبل المتابعة
      if (!isFinite(x) || !isFinite(y) || !isFinite(width) || !isFinite(height)) {
        console.warn('Face AR - invalid bounding box values', { x, y, width, height });
        setFaceDetected(false);
        setFaceZones([]);
        return;
      }

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

    const hasNegative = negativeIngredients && negativeIngredients.length > 0;
    const hasPositive = positiveIngredients && positiveIngredients.length > 0;
    const hasSuspicious = suspiciousIngredients && suspiciousIngredients.length > 0;

    // Forehead zone - سلبية + مشكوك فيها
    const foreheadNegative = negativeIngredients.slice(0, 3).map(ing => ({
      ingredient: ing.name,
      type: 'negative' as const,
      description: ing.impact || ing.description || 'قد يؤثر سلباً على البشرة'
    }));

    const foreheadSuspicious = suspiciousIngredients.slice(0, 2).map(ing => ({
      ingredient: ing.name,
      type: 'negative' as const,
      description: ing.concern || ing.description || 'مكون مشكوك فيه قد يسبب تهيجاً أو ضرراً'
    }));

    const foreheadEffects = [...foreheadNegative, ...foreheadSuspicious];

    if (foreheadEffects.length > 0) {
      zones.push({
        name: 'الجبهة',
        x: x,
        y: y,
        width: width,
        height: height * 0.3,
        effects: foreheadEffects,
      });
    }

    // Cheeks zone - سلبية + مشكوك فيها + إيجابية
    const cheeksNegative = negativeIngredients.slice(0, 2).map(ing => ({
      ingredient: ing.name,
      type: 'negative' as const,
      description: ing.impact || ing.description || 'قد يسبب تهيج أو جفاف'
    }));

    const cheeksSuspicious = suspiciousIngredients.slice(0, 2).map(ing => ({
      ingredient: ing.name,
      type: 'negative' as const,
      description: ing.concern || ing.description || 'مكون مشكوك فيه قد يؤثر على توازن البشرة'
    }));

    const cheeksPositive = positiveIngredients.slice(0, 2).map(ing => ({
      ingredient: ing.name,
      type: 'positive' as const,
      description: ing.benefit || ing.description || 'مفيد للبشرة'
    }));

    const cheeksEffects = [...cheeksNegative, ...cheeksSuspicious, ...cheeksPositive];

    if (cheeksEffects.length > 0) {
      zones.push({
        name: 'الخدود',
        x: x,
        y: y + height * 0.3,
        width: width,
        height: height * 0.4,
        effects: cheeksEffects,
      });
    }

    // T-zone - باقي السلبية + المشكوك فيها + الإيجابية
    const tZoneNegative = negativeIngredients.slice(3, 6).map(ing => ({
      ingredient: ing.name,
      type: 'negative' as const,
      description: ing.impact || ing.description || 'قد يؤثر على المسام أو يسبب انسدادها'
    }));

    const tZoneSuspicious = suspiciousIngredients.slice(2, 5).map(ing => ({
      ingredient: ing.name,
      type: 'negative' as const,
      description: ing.concern || ing.description || 'مكون مشكوك فيه قد يؤثر على منطقة T'
    }));

    const tZonePositive = positiveIngredients.slice(2, 5).map(ing => ({
      ingredient: ing.name,
      type: 'positive' as const,
      description: ing.benefit || ing.description || 'يساعد على تحسين البشرة'
    }));

    const tZoneEffects = [...tZoneNegative, ...tZoneSuspicious, ...tZonePositive];

    if (tZoneEffects.length > 0) {
      zones.push({
        name: 'منطقة T',
        x: x + width * 0.3,
        y: y + height * 0.2,
        width: width * 0.4,
        height: height * 0.5,
        effects: tZoneEffects,
      });
    }

    // Fallback: إذا لم تُنشأ أي مناطق ولكن هناك مكونات، أنشئ منطقة عامة للوجه
    const totalIngredientsCount =
      (negativeIngredients?.length || 0) +
      (positiveIngredients?.length || 0) +
      (suspiciousIngredients?.length || 0);

    if (zones.length === 0 && totalIngredientsCount > 0) {
      const allEffects = [
        ...negativeIngredients.map(ing => ({
          ingredient: ing.name,
          type: 'negative' as const,
          description: ing.impact || ing.description || 'تأثير سلبي محتمل'
        })),
        ...suspiciousIngredients.map(ing => ({
          ingredient: ing.name,
          type: 'negative' as const,
          description: ing.concern || ing.description || 'مكون مشكوك فيه قد يؤثر على البشرة'
        })),
        ...positiveIngredients.map(ing => ({
          ingredient: ing.name,
          type: 'positive' as const,
          description: ing.benefit || ing.description || 'تأثير إيجابي'
        })),
      ];

      zones.push({
        name: 'منطقة الوجه',
        x: x,
        y: y,
        width: width,
        height: height,
        effects: allEffects,
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

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    
    // Handle both mouse and touch events
    let clientX: number, clientY: number;
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const clickX = (clientX - rect.left) * scaleX;
    const clickY = (clientY - rect.top) * scaleY;

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
      <div className="absolute inset-0 flex items-center justify-center bg-black overflow-hidden">
        <div className="relative w-full h-full flex items-center justify-center">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            autoPlay
            muted
            style={{ transform: 'scaleX(-1)' }} // Mirror effect
          />
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onTouchStart={handleCanvasClick}
            className="absolute inset-0 w-full h-full object-cover cursor-pointer"
            style={{ 
              transform: 'scaleX(-1)',
              touchAction: 'none'
            }}
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
        <Card className="absolute top-16 left-4 right-4 md:top-20 md:right-4 md:left-auto md:w-80 p-4 bg-background/95 backdrop-blur-sm border-primary/20 shadow-xl z-10 max-h-[50vh] overflow-y-auto">
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
      <div className="absolute bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 bg-background/90 backdrop-blur-sm rounded-lg p-3 md:p-4 text-sm text-center z-10 md:max-w-md">
        <p className="font-semibold text-foreground mb-2">📱 معاينة التأثير على الوجه</p>
        <p className="text-muted-foreground text-xs">
          {faceDetected
            ? (negativeIngredients.length + positiveIngredients.length + suspiciousIngredients.length > 0
                ? '✓ وجه للكاميرا وانقر على المناطق الملونة لعرض التفاصيل'
                : 'تم رصد الوجه ولكن لا توجد مكونات ذات تأثير واضح على البشرة في هذا المنتج')
            : 'الرجاء وضع وجهك أمام الكاميرا'}
        </p>
        <div className="flex items-center justify-center gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-destructive rounded-full"></div>
            <span>تأثير سلبي / مشكوك فيه</span>
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
