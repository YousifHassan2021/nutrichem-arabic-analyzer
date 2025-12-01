import { useState } from "react";
import { Card } from "./ui/card";

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
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const organInfo: Record<string, { name: string; x: number; y: number }> = {
    brain: { name: "الدماغ", x: 160, y: 60 },
    lungs: { name: "الرئتين", x: 160, y: 180 },
    heart: { name: "القلب", x: 160, y: 200 },
    liver: { name: "الكبد", x: 180, y: 240 },
    stomach: { name: "المعدة", x: 140, y: 260 },
    kidneys: { name: "الكلى", x: 160, y: 280 },
    intestines: { name: "الأمعاء", x: 160, y: 320 },
    skin: { name: "الجلد", x: 160, y: 400 },
  };

  const getOrganColor = (organId: string) => {
    const effect = affectedOrgans.find((o) => o.id === organId);
    if (!effect) return "hsl(var(--muted))";
    
    switch (effect.severity) {
      case "safe":
        return "hsl(142, 76%, 36%)"; // أخضر
      case "moderate":
        return "hsl(45, 93%, 47%)"; // أصفر
      case "severe":
        return "hsl(0, 84%, 60%)"; // أحمر
      default:
        return "hsl(var(--muted))";
    }
  };

  const getOrganOpacity = (organId: string) => {
    const effect = affectedOrgans.find((o) => o.id === organId);
    return effect ? 0.8 : 0.3;
  };

  const handleOrganClick = (organId: string, event: React.MouseEvent<SVGElement>) => {
    const effect = affectedOrgans.find((o) => o.id === organId);
    if (effect) {
      setSelectedOrgan(organId);
      const rect = event.currentTarget.getBoundingClientRect();
      setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
    }
  };

  const selectedEffect = selectedOrgan
    ? affectedOrgans.find((o) => o.id === selectedOrgan)
    : null;

  return (
    <div className="relative w-full">
      <div className="flex flex-col items-center gap-4">
        <svg
          width="100%"
          height="650"
          viewBox="0 0 320 700"
          className="max-w-md mx-auto"
          style={{ filter: "drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15))" }}
        >
          {/* Body silhouette - Enhanced */}
          <defs>
            <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: "hsl(var(--muted))", stopOpacity: 0.4 }} />
              <stop offset="100%" style={{ stopColor: "hsl(var(--muted))", stopOpacity: 0.2 }} />
            </linearGradient>
          </defs>
          
          {/* Head */}
          <ellipse
            cx="160"
            cy="60"
            rx="45"
            ry="55"
            fill="url(#bodyGradient)"
            stroke="hsl(var(--border))"
            strokeWidth="2"
            opacity="0.5"
          />
          
          {/* Neck */}
          <rect
            x="145"
            y="100"
            width="30"
            height="25"
            rx="5"
            fill="url(#bodyGradient)"
            stroke="hsl(var(--border))"
            strokeWidth="2"
            opacity="0.5"
          />
          
          {/* Upper body/chest */}
          <ellipse
            cx="160"
            cy="160"
            rx="55"
            ry="45"
            fill="url(#bodyGradient)"
            stroke="hsl(var(--border))"
            strokeWidth="2"
            opacity="0.5"
          />
          
          {/* Abdomen */}
          <rect
            x="125"
            y="200"
            width="70"
            height="100"
            rx="20"
            fill="url(#bodyGradient)"
            stroke="hsl(var(--border))"
            strokeWidth="2"
            opacity="0.5"
          />
          
          {/* Lower body */}
          <rect
            x="130"
            y="300"
            width="60"
            height="120"
            rx="15"
            fill="url(#bodyGradient)"
            stroke="hsl(var(--border))"
            strokeWidth="2"
            opacity="0.5"
          />
          
          {/* Legs */}
          <rect
            x="135"
            y="420"
            width="22"
            height="140"
            rx="10"
            fill="url(#bodyGradient)"
            stroke="hsl(var(--border))"
            strokeWidth="2"
            opacity="0.5"
          />
          <rect
            x="163"
            y="420"
            width="22"
            height="140"
            rx="10"
            fill="url(#bodyGradient)"
            stroke="hsl(var(--border))"
            strokeWidth="2"
            opacity="0.5"
          />

          {/* Brain */}
          <ellipse
            id="brain"
            cx="160"
            cy="60"
            rx="38"
            ry="48"
            fill={getOrganColor("brain")}
            opacity={getOrganOpacity("brain")}
            onClick={(e) => handleOrganClick("brain", e)}
            className="cursor-pointer transition-all hover:opacity-100 hover:scale-105"
            stroke="hsl(var(--foreground))"
            strokeWidth="3"
            style={{ filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))" }}
          />
          <text
            x="160"
            y="65"
            textAnchor="middle"
            fontSize="12"
            fill="hsl(var(--foreground))"
            fontWeight="bold"
            pointerEvents="none"
            opacity={getOrganOpacity("brain")}
          >
            دماغ
          </text>

          {/* Lungs */}
          <g id="lungs" onClick={(e) => handleOrganClick("lungs", e)} className="cursor-pointer">
            <ellipse
              cx="140"
              cy="160"
              rx="22"
              ry="42"
              fill={getOrganColor("lungs")}
              opacity={getOrganOpacity("lungs")}
              className="transition-all hover:opacity-100 hover:scale-105"
              stroke="hsl(var(--foreground))"
              strokeWidth="3"
              style={{ filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))" }}
            />
            <ellipse
              cx="180"
              cy="160"
              rx="22"
              ry="42"
              fill={getOrganColor("lungs")}
              opacity={getOrganOpacity("lungs")}
              className="transition-all hover:opacity-100 hover:scale-105"
              stroke="hsl(var(--foreground))"
              strokeWidth="3"
              style={{ filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))" }}
            />
            <text
              x="160"
              y="165"
              textAnchor="middle"
              fontSize="12"
              fill="hsl(var(--foreground))"
              fontWeight="bold"
              pointerEvents="none"
              opacity={getOrganOpacity("lungs")}
            >
              رئتين
            </text>
          </g>

          {/* Heart */}
          <path
            id="heart"
            d="M160,210 L145,195 Q140,190 140,180 Q140,170 150,170 Q160,170 160,180 Q160,170 170,170 Q180,170 180,180 Q180,190 175,195 Z"
            fill={getOrganColor("heart")}
            opacity={getOrganOpacity("heart")}
            onClick={(e) => handleOrganClick("heart", e)}
            className="cursor-pointer transition-all hover:opacity-100 hover:scale-105"
            stroke="hsl(var(--foreground))"
            strokeWidth="3"
            style={{ filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))" }}
          />
          <text
            x="160"
            y="195"
            textAnchor="middle"
            fontSize="11"
            fill="hsl(var(--foreground))"
            fontWeight="bold"
            pointerEvents="none"
            opacity={getOrganOpacity("heart")}
          >
            قلب
          </text>

          {/* Liver */}
          <ellipse
            id="liver"
            cx="175"
            cy="235"
            rx="38"
            ry="28"
            fill={getOrganColor("liver")}
            opacity={getOrganOpacity("liver")}
            onClick={(e) => handleOrganClick("liver", e)}
            className="cursor-pointer transition-all hover:opacity-100 hover:scale-105"
            stroke="hsl(var(--foreground))"
            strokeWidth="3"
            style={{ filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))" }}
          />
          <text
            x="175"
            y="240"
            textAnchor="middle"
            fontSize="12"
            fill="hsl(var(--foreground))"
            fontWeight="bold"
            pointerEvents="none"
            opacity={getOrganOpacity("liver")}
          >
            كبد
          </text>

          {/* Stomach */}
          <ellipse
            id="stomach"
            cx="145"
            cy="265"
            rx="28"
            ry="38"
            fill={getOrganColor("stomach")}
            opacity={getOrganOpacity("stomach")}
            onClick={(e) => handleOrganClick("stomach", e)}
            className="cursor-pointer transition-all hover:opacity-100 hover:scale-105"
            stroke="hsl(var(--foreground))"
            strokeWidth="3"
            style={{ filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))" }}
          />
          <text
            x="145"
            y="270"
            textAnchor="middle"
            fontSize="12"
            fill="hsl(var(--foreground))"
            fontWeight="bold"
            pointerEvents="none"
            opacity={getOrganOpacity("stomach")}
          >
            معدة
          </text>

          {/* Kidneys */}
          <g id="kidneys" onClick={(e) => handleOrganClick("kidneys", e)} className="cursor-pointer">
            <ellipse
              cx="140"
              cy="305"
              rx="17"
              ry="28"
              fill={getOrganColor("kidneys")}
              opacity={getOrganOpacity("kidneys")}
              className="transition-all hover:opacity-100 hover:scale-105"
              stroke="hsl(var(--foreground))"
              strokeWidth="3"
              style={{ filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))" }}
            />
            <ellipse
              cx="180"
              cy="305"
              rx="17"
              ry="28"
              fill={getOrganColor("kidneys")}
              opacity={getOrganOpacity("kidneys")}
              className="transition-all hover:opacity-100 hover:scale-105"
              stroke="hsl(var(--foreground))"
              strokeWidth="3"
              style={{ filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))" }}
            />
            <text
              x="160"
              y="310"
              textAnchor="middle"
              fontSize="12"
              fill="hsl(var(--foreground))"
              fontWeight="bold"
              pointerEvents="none"
              opacity={getOrganOpacity("kidneys")}
            >
              كلى
            </text>
          </g>

          {/* Intestines */}
          <g onClick={(e) => handleOrganClick("intestines", e)} className="cursor-pointer">
            <path
              id="intestines"
              d="M145,340 Q155,350 145,360 Q135,370 145,380 Q155,390 145,400 Q135,410 150,415"
              fill="none"
              stroke={getOrganColor("intestines")}
              strokeWidth="22"
              opacity={getOrganOpacity("intestines")}
              className="transition-all hover:opacity-100"
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))" }}
            />
            <path
              id="intestines2"
              d="M175,340 Q165,350 175,360 Q185,370 175,380 Q165,390 175,400 Q185,410 170,415"
              fill="none"
              stroke={getOrganColor("intestines")}
              strokeWidth="22"
              opacity={getOrganOpacity("intestines")}
              className="transition-all hover:opacity-100"
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))" }}
            />
            <text
              x="160"
              y="380"
              textAnchor="middle"
              fontSize="12"
              fill="hsl(var(--foreground))"
              fontWeight="bold"
              pointerEvents="none"
              opacity={getOrganOpacity("intestines")}
            >
              أمعاء
            </text>
          </g>

          {/* Skin - outline */}
          <g onClick={(e) => handleOrganClick("skin", e)} className="cursor-pointer">
            <rect
              id="skin"
              x="115"
              y="115"
              width="90"
              height="450"
              rx="45"
              fill="none"
              stroke={getOrganColor("skin")}
              strokeWidth="5"
              opacity={getOrganOpacity("skin")}
              className="transition-all hover:opacity-100"
              style={{ filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))" }}
              strokeDasharray="10,5"
            />
            <text
              x="160"
              y="490"
              textAnchor="middle"
              fontSize="14"
              fill="hsl(var(--foreground))"
              fontWeight="bold"
              pointerEvents="none"
              opacity={getOrganOpacity("skin")}
            >
              جلد
            </text>
          </g>
        </svg>

        {/* Legend */}
        <div className="flex gap-4 flex-wrap justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "hsl(142, 76%, 36%)" }} />
            <span className="text-sm">آمن</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "hsl(45, 93%, 47%)" }} />
            <span className="text-sm">تأثير متوسط</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "hsl(0, 84%, 60%)" }} />
            <span className="text-sm">تأثير قوي</span>
          </div>
        </div>

        {/* Tooltip/Info Card */}
        {selectedEffect && (
          <Card className="w-full max-w-md p-4 animate-in fade-in-50 slide-in-from-bottom-5">
            <h3 className="text-lg font-bold mb-2">
              {organInfo[selectedEffect.id]?.name || selectedEffect.id}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">{selectedEffect.description}</p>
            <div>
              <p className="text-sm font-semibold mb-1">المكونات المؤثرة:</p>
              <ul className="text-sm space-y-1">
                {selectedEffect.ingredients.map((ing, idx) => (
                  <li key={idx} className="text-muted-foreground">
                    • {ing}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
