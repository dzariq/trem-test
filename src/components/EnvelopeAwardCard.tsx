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
      className="relative cursor-pointer transition-transform active:scale-[0.98] hover:shadow-lg"
      onClick={onClick}
    >
      {/* Dark green letter peeking out from behind the flap */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-4 rounded-t-md z-0"
        style={{
          background: 'linear-gradient(180deg, #1a3d2e 0%, #0f2318 100%)',
        }}
      />

      {/* Main envelope body with flap */}
      <div 
        className="relative pt-4 pb-4 px-4 rounded-xl border mt-2 overflow-hidden"
        style={{ 
          background: 'linear-gradient(145deg, #fef3c7 0%, #fde68a 25%, #fbbf24 60%, #f59e0b 100%)', 
          borderColor: 'rgba(217, 119, 6, 0.4)',
          boxShadow: '0 2px 8px rgba(217, 119, 6, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
        }}
      >
        {/* Envelope flap - triangle outline only */}
        <div className="absolute top-0 left-0 right-0 overflow-visible z-20">
          <svg 
            viewBox="0 0 100 18" 
            preserveAspectRatio="none" 
            className="w-full h-5"
          >
            {/* Same gold background as envelope */}
            <polygon points="0,0 100,0 50,18" fill="#f59e0b"/>
            {/* Triangle outline */}
            <polygon 
              points="0,0 100,0 50,18" 
              fill="none" 
              stroke="#b45309" 
              strokeWidth="0.8"
              strokeLinejoin="round"
            />
            {/* Subtle fold lines */}
            <line x1="0" y1="0" x2="50" y2="18" stroke="rgba(255,255,255,0.15)" strokeWidth="0.3"/>
            <line x1="100" y1="0" x2="50" y2="18" stroke="rgba(0,0,0,0.08)" strokeWidth="0.3"/>
          </svg>
        </div>

        {/* Shine effect */}
        <div className="absolute inset-0 pointer-events-none rounded-xl" style={{ background: 'radial-gradient(ellipse at 20% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 40%)' }} />
        
        {/* Decorative trophy watermarks */}
        <div className="absolute top-8 right-2 opacity-[0.15] pointer-events-none rotate-[-8deg]">
          <Trophy className="h-14 w-14 text-amber-700" strokeWidth={1} />
        </div>
        <div className="absolute -bottom-2 right-16 opacity-[0.12] pointer-events-none rotate-[10deg]">
          <Trophy className="h-11 w-11 text-amber-700" strokeWidth={1} />
        </div>

        {/* Content */}
        <div className="relative flex items-start gap-3 pr-14 mt-4">
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
