import { useState } from "react";
import { Card } from "./ui/card";
import humanAnatomyImage from "@/assets/human-anatomy.png";

interface OrganEffect {
  id: string;
  severity: "safe" | "moderate" | "severe";
  ingredients: string[];
  description: string;
}

interface InteractiveBodySVGProps {
  affectedOrgans: OrganEffect[];
}

export const InteractiveBodySVG = ({ affectedOrgans }: InteractiveBodySVGProps) => {
  const [selectedOrgan, setSelectedOrgan] = useState<string | null>(null);

  // Organ positions calibrated precisely to the anatomical image
  const organPositions: Record<string, { name: string; top: number; left: number; width: number; height: number; borderRadius: string }> = {
    brain: { name: "الدماغ", top: 2, left: 35, width: 30, height: 10, borderRadius: "50%" },
    lungs: { name: "الرئتين", top: 22, left: 28, width: 44, height: 14, borderRadius: "25%" },
    heart: { name: "القلب", top: 26, left: 45, width: 12, height: 10, borderRadius: "50%" },
    liver: { name: "الكبد", top: 37, left: 30, width: 20, height: 10, borderRadius: "40%" },
    stomach: { name: "المعدة", top: 40, left: 48, width: 18, height: 12, borderRadius: "45%" },
    kidneys: { name: "الكلى", top: 46, left: 32, width: 36, height: 8, borderRadius: "35%" },
    intestines: { name: "الأمعاء", top: 52, left: 35, width: 30, height: 16, borderRadius: "30%" },
    skin: { name: "الجلد", top: 0, left: 0, width: 100, height: 100, borderRadius: "16px" },
  };

  const getOrganGlow = (organId: string) => {
    const effect = affectedOrgans.find((o) => o.id === organId);
    if (!effect) return "transparent";
    
    switch (effect.severity) {
      case "safe":
        return "rgba(34, 197, 94, 0.5)"; // أخضر متوهج
      case "moderate":
        return "rgba(234, 179, 8, 0.5)"; // أصفر متوهج
      case "severe":
        return "rgba(239, 68, 68, 0.6)"; // أحمر متوهج
      default:
        return "transparent";
    }
  };

  const getOrganBorderColor = (organId: string) => {
    const effect = affectedOrgans.find((o) => o.id === organId);
    if (!effect) return "transparent";
    
    switch (effect.severity) {
      case "safe":
        return "rgba(34, 197, 94, 0.8)";
      case "moderate":
        return "rgba(234, 179, 8, 0.8)";
      case "severe":
        return "rgba(239, 68, 68, 0.9)";
      default:
        return "transparent";
    }
  };

  const isOrganAffected = (organId: string) => {
    return affectedOrgans.some((o) => o.id === organId);
  };

  const handleOrganClick = (organId: string) => {
    const effect = affectedOrgans.find((o) => o.id === organId);
    if (effect) {
      setSelectedOrgan(selectedOrgan === organId ? null : organId);
    }
  };

  const selectedEffect = selectedOrgan
    ? affectedOrgans.find((o) => o.id === selectedOrgan)
    : null;

  return (
    <div className="relative w-full">
      <div className="flex flex-col items-center gap-6">
        {/* Anatomical Image with Overlays */}
        <div className="relative w-full max-w-sm mx-auto">
          <img
            src={humanAnatomyImage}
            alt="Human Anatomy"
            className="w-full h-auto rounded-2xl"
            style={{
              filter: "brightness(1.1) contrast(1.05)",
            }}
          />
          
          {/* Interactive Organ Overlays */}
          {Object.entries(organPositions).map(([organId, pos]) => {
            if (organId === "skin") return null; // Skip skin as full overlay
            
            const isAffected = isOrganAffected(organId);
            if (!isAffected) return null;

            return (
              <div
                key={organId}
                onClick={() => handleOrganClick(organId)}
                className={`absolute cursor-pointer transition-all duration-500 ${
                  selectedOrgan === organId ? 'ring-2 ring-white/50 scale-105' : ''
                }`}
                style={{
                  top: `${pos.top}%`,
                  left: `${pos.left}%`,
                  width: `${pos.width}%`,
                  height: `${pos.height}%`,
                  borderRadius: pos.borderRadius,
                  background: getOrganGlow(organId),
                  border: `2px solid ${getOrganBorderColor(organId)}`,
                  boxShadow: isAffected 
                    ? `0 0 15px ${getOrganGlow(organId)}, 0 0 30px ${getOrganGlow(organId)}, inset 0 0 10px ${getOrganGlow(organId)}`
                    : 'none',
                  animation: isAffected ? 'pulse 2s infinite' : 'none',
                }}
              >
                {/* Organ Label */}
                <div 
                  className="absolute -top-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
                  style={{
                    textShadow: '0 0 10px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.6)',
                  }}
                >
                  <span className="text-white text-xs font-bold bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {pos.name}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Skin Overlay - Outline only on body silhouette */}
          {isOrganAffected("skin") && (
            <div
              className="absolute transition-all duration-500 pointer-events-none"
              style={{
                top: '2%',
                left: '25%',
                width: '50%',
                height: '96%',
                borderRadius: '40% 40% 35% 35%',
                background: 'transparent',
                border: `3px solid ${getOrganBorderColor("skin")}`,
                boxShadow: `0 0 15px ${getOrganGlow("skin")}, 0 0 25px ${getOrganBorderColor("skin")}`,
                animation: 'pulse 2s infinite',
              }}
            >
              <span 
                onClick={() => handleOrganClick("skin")}
                className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-white text-xs font-bold bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm cursor-pointer pointer-events-auto hover:bg-black/80"
                style={{ textShadow: '0 0 10px rgba(0,0,0,0.8)' }}
              >
                الجلد
              </span>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex gap-6 flex-wrap justify-center bg-card/50 backdrop-blur-sm p-4 rounded-xl border border-border/50">
          <div className="flex items-center gap-2">
            <div 
              className="w-5 h-5 rounded-full" 
              style={{ 
                backgroundColor: "rgba(34, 197, 94, 0.8)",
                boxShadow: "0 0 10px rgba(34, 197, 94, 0.6)"
              }} 
            />
            <span className="text-sm font-medium">آمن</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-5 h-5 rounded-full" 
              style={{ 
                backgroundColor: "rgba(234, 179, 8, 0.8)",
                boxShadow: "0 0 10px rgba(234, 179, 8, 0.6)"
              }} 
            />
            <span className="text-sm font-medium">تأثير متوسط</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-5 h-5 rounded-full" 
              style={{ 
                backgroundColor: "rgba(239, 68, 68, 0.8)",
                boxShadow: "0 0 10px rgba(239, 68, 68, 0.6)"
              }} 
            />
            <span className="text-sm font-medium">تأثير قوي</span>
          </div>
        </div>

        {/* Tooltip/Info Card */}
        {selectedEffect && (
          <Card className="w-full max-w-md p-5 animate-in fade-in-50 slide-in-from-bottom-5 bg-gradient-to-br from-card to-card/80 border-2"
            style={{ borderColor: getOrganBorderColor(selectedEffect.id) }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ 
                  backgroundColor: getOrganBorderColor(selectedEffect.id),
                  boxShadow: `0 0 10px ${getOrganGlow(selectedEffect.id)}`
                }}
              />
              <h3 className="text-lg font-bold">
                {organPositions[selectedEffect.id]?.name || selectedEffect.id}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{selectedEffect.description}</p>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-sm font-semibold mb-2 text-foreground">المكونات المؤثرة:</p>
              <ul className="text-sm space-y-1.5">
                {selectedEffect.ingredients.map((ing, idx) => (
                  <li key={idx} className="text-muted-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {ing}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        )}

        {/* Instruction */}
        {affectedOrgans.length > 0 && !selectedOrgan && (
          <p className="text-sm text-muted-foreground text-center animate-pulse">
            اضغط على العضو المتوهج لعرض التفاصيل
          </p>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.8;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
