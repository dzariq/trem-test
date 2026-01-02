import { Trophy, Award } from "lucide-react";

interface EnvelopeAwardCardProps {
  category: string;
  categoryColor: { bg: string; text: string };
  organization: string;
  role: string;
  onClick: () => void;
}

export function EnvelopeAwardCard({
  category,
  categoryColor,
  organization,
  role,
  onClick,
}: EnvelopeAwardCardProps) {
  return (
    <div 
      className="relative overflow-hidden cursor-pointer transition-transform active:scale-[0.98] hover:shadow-lg rounded-xl"
      onClick={onClick}
    >
      {/* Dark green letter peeking out from top */}
      <div 
        className="absolute top-0 left-4 right-4 h-6 rounded-t-lg z-0"
        style={{
          background: 'linear-gradient(180deg, #1a3d2e 0%, #0f2318 100%)',
          boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2)'
        }}
      />

      {/* Main envelope body */}
      <div 
        className="relative pt-4 pb-4 px-4 rounded-xl border mt-3"
        style={{ 
          background: 'linear-gradient(145deg, #fef3c7 0%, #fde68a 25%, #fbbf24 60%, #f59e0b 100%)', 
          borderColor: 'rgba(217, 119, 6, 0.4)',
          boxShadow: '0 2px 8px rgba(217, 119, 6, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
        }}
      >
        {/* Envelope flap - simple triangle */}
        <div className="absolute -top-3 left-0 right-0 h-8 overflow-hidden">
          <svg 
            viewBox="0 0 100 25" 
            preserveAspectRatio="none" 
            className="w-full h-full"
          >
            <defs>
              <linearGradient id="flapGradientSimple" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#e8a912"/>
                <stop offset="50%" stopColor="#d4950f"/>
                <stop offset="100%" stopColor="#c9880d"/>
              </linearGradient>
            </defs>
            {/* Simple triangle flap */}
            <polygon points="0,25 50,0 100,25" fill="url(#flapGradientSimple)"/>
            {/* Fold lines for depth */}
            <line x1="0" y1="25" x2="50" y2="0" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5"/>
            <line x1="50" y1="0" x2="100" y2="25" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5"/>
            {/* Bottom edge shadow */}
            <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5"/>
          </svg>
        </div>

        {/* Shine effect */}
        <div className="absolute inset-0 pointer-events-none rounded-xl" style={{ background: 'radial-gradient(ellipse at 20% 10%, rgba(255, 255, 255, 0.35) 0%, transparent 35%)' }} />
        
        {/* Decorative trophy watermarks */}
        <div className="absolute -top-1 right-2 opacity-[0.15] pointer-events-none rotate-[-8deg]">
          <Trophy className="h-14 w-14 text-amber-700" strokeWidth={1} />
        </div>
        <div className="absolute -bottom-2 right-16 opacity-[0.12] pointer-events-none rotate-[10deg]">
          <Trophy className="h-11 w-11 text-amber-700" strokeWidth={1} />
        </div>

        {/* Content */}
        <div className="relative flex items-start gap-3 pr-14 mt-1">
          <div className="p-2.5 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: 'rgba(251, 191, 36, 0.25)', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
            <Trophy className="h-5 w-5" style={{ color: '#b45309' }} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span 
                className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full" 
                style={{ backgroundColor: categoryColor.bg, color: categoryColor.text }}
              >
                {category}
              </span>
            </div>
            <h3 className="font-semibold" style={{ color: '#78350f' }}>{organization}</h3>
            <p className="text-sm flex items-center gap-1.5 mt-1" style={{ color: '#92400e' }}>
              <Award className="h-3.5 w-3.5" />
              {role}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
