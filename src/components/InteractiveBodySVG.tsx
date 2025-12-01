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
          height="600"
          viewBox="0 0 320 700"
          className="max-w-md mx-auto"
          style={{ filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))" }}
        >
          {/* Body silhouette */}
          <ellipse
            cx="160"
            cy="60"
            rx="40"
            ry="50"
            fill="hsl(var(--muted))"
            opacity="0.2"
          />
          <rect
            x="130"
            y="100"
            width="60"
            height="80"
            rx="10"
            fill="hsl(var(--muted))"
            opacity="0.2"
          />
          <rect
            x="120"
            y="180"
            width="80"
            height="180"
            rx="15"
            fill="hsl(var(--muted))"
            opacity="0.2"
          />
          <rect
            x="130"
            y="360"
            width="60"
            height="200"
            rx="10"
            fill="hsl(var(--muted))"
            opacity="0.2"
          />

          {/* Brain */}
          <ellipse
            id="brain"
            cx="160"
            cy="60"
            rx="35"
            ry="45"
            fill={getOrganColor("brain")}
            opacity={getOrganOpacity("brain")}
            onClick={(e) => handleOrganClick("brain", e)}
            className="cursor-pointer transition-all hover:opacity-100"
            stroke="hsl(var(--border))"
            strokeWidth="2"
          />

          {/* Lungs */}
          <g id="lungs" onClick={(e) => handleOrganClick("lungs", e)} className="cursor-pointer">
            <ellipse
              cx="140"
              cy="170"
              rx="20"
              ry="40"
              fill={getOrganColor("lungs")}
              opacity={getOrganOpacity("lungs")}
              className="transition-all hover:opacity-100"
              stroke="hsl(var(--border))"
              strokeWidth="2"
            />
            <ellipse
              cx="180"
              cy="170"
              rx="20"
              ry="40"
              fill={getOrganColor("lungs")}
              opacity={getOrganOpacity("lungs")}
              className="transition-all hover:opacity-100"
              stroke="hsl(var(--border))"
              strokeWidth="2"
            />
          </g>

          {/* Heart */}
          <path
            id="heart"
            d="M160,200 L145,185 Q140,180 140,170 Q140,160 150,160 Q160,160 160,170 Q160,160 170,160 Q180,160 180,170 Q180,180 175,185 Z"
            fill={getOrganColor("heart")}
            opacity={getOrganOpacity("heart")}
            onClick={(e) => handleOrganClick("heart", e)}
            className="cursor-pointer transition-all hover:opacity-100"
            stroke="hsl(var(--border))"
            strokeWidth="2"
          />

          {/* Liver */}
          <ellipse
            id="liver"
            cx="180"
            cy="240"
            rx="35"
            ry="25"
            fill={getOrganColor("liver")}
            opacity={getOrganOpacity("liver")}
            onClick={(e) => handleOrganClick("liver", e)}
            className="cursor-pointer transition-all hover:opacity-100"
            stroke="hsl(var(--border))"
            strokeWidth="2"
          />

          {/* Stomach */}
          <ellipse
            id="stomach"
            cx="140"
            cy="260"
            rx="25"
            ry="35"
            fill={getOrganColor("stomach")}
            opacity={getOrganOpacity("stomach")}
            onClick={(e) => handleOrganClick("stomach", e)}
            className="cursor-pointer transition-all hover:opacity-100"
            stroke="hsl(var(--border))"
            strokeWidth="2"
          />

          {/* Kidneys */}
          <g id="kidneys" onClick={(e) => handleOrganClick("kidneys", e)} className="cursor-pointer">
            <ellipse
              cx="145"
              cy="280"
              rx="15"
              ry="25"
              fill={getOrganColor("kidneys")}
              opacity={getOrganOpacity("kidneys")}
              className="transition-all hover:opacity-100"
              stroke="hsl(var(--border))"
              strokeWidth="2"
            />
            <ellipse
              cx="175"
              cy="280"
              rx="15"
              ry="25"
              fill={getOrganColor("kidneys")}
              opacity={getOrganOpacity("kidneys")}
              className="transition-all hover:opacity-100"
              stroke="hsl(var(--border))"
              strokeWidth="2"
            />
          </g>

          {/* Intestines */}
          <path
            id="intestines"
            d="M140,310 Q150,320 140,330 Q130,340 140,350 Q150,360 140,370 Q130,380 145,385"
            fill="none"
            stroke={getOrganColor("intestines")}
            strokeWidth="20"
            opacity={getOrganOpacity("intestines")}
            onClick={(e) => handleOrganClick("intestines", e)}
            className="cursor-pointer transition-all hover:opacity-100"
            strokeLinecap="round"
          />
          <path
            id="intestines2"
            d="M180,310 Q170,320 180,330 Q190,340 180,350 Q170,360 180,370 Q190,380 175,385"
            fill="none"
            stroke={getOrganColor("intestines")}
            strokeWidth="20"
            opacity={getOrganOpacity("intestines")}
            onClick={(e) => handleOrganClick("intestines", e)}
            className="cursor-pointer transition-all hover:opacity-100"
            strokeLinecap="round"
          />

          {/* Skin - outline */}
          <rect
            id="skin"
            x="125"
            y="110"
            width="70"
            height="450"
            rx="35"
            fill="none"
            stroke={getOrganColor("skin")}
            strokeWidth="4"
            opacity={getOrganOpacity("skin")}
            onClick={(e) => handleOrganClick("skin", e)}
            className="cursor-pointer transition-all hover:opacity-100"
          />
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
