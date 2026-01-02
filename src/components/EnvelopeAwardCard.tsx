import { Trophy, Award } from "lucide-react";
import { ReactNode } from "react";

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
      className="relative overflow-hidden cursor-pointer transition-transform active:scale-[0.98] hover:shadow-lg"
      onClick={onClick}
    >
      {/* Envelope flap (triangular top) */}
      <div 
        className="absolute top-0 left-0 right-0 h-8 z-10"
        style={{
          background: 'linear-gradient(180deg, #e8a912 0%, #d4950f 100%)',
        }}
      >
        {/* Triangle flap */}
        <svg 
          viewBox="0 0 100 30" 
          preserveAspectRatio="none" 
          className="absolute top-0 left-0 w-full h-full"
        >
          <defs>
            <linearGradient id="flapGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f5c842"/>
              <stop offset="50%" stopColor="#e8a912"/>
              <stop offset="100%" stopColor="#d4950f"/>
            </linearGradient>
            <linearGradient id="flapShadow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.1)"/>
              <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
            </linearGradient>
          </defs>
          {/* Main flap triangle */}
          <polygon points="0,0 50,30 100,0" fill="url(#flapGradient)"/>
          {/* Shadow under flap */}
          <polygon points="0,0 50,30 100,0" fill="url(#flapShadow)" opacity="0.3"/>
          {/* Fold line highlight */}
          <line x1="0" y1="0" x2="50" y2="30" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
          <line x1="50" y1="30" x2="100" y2="0" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
        </svg>
      </div>

      {/* Main envelope body */}
      <div 
        className="relative pt-6 pb-4 px-4 rounded-xl border"
        style={{ 
          background: 'linear-gradient(145deg, #fef3c7 0%, #fde68a 25%, #fbbf24 60%, #f59e0b 100%)', 
          borderColor: 'rgba(217, 119, 6, 0.4)',
          boxShadow: '0 2px 8px rgba(217, 119, 6, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
        }}
      >
        {/* Shine effect */}
        <div className="absolute inset-0 pointer-events-none rounded-xl" style={{ background: 'radial-gradient(ellipse at 20% 10%, rgba(255, 255, 255, 0.35) 0%, transparent 35%)' }} />
        
        {/* Decorative trophy watermarks */}
        <div className="absolute -top-1 right-2 opacity-[0.15] pointer-events-none rotate-[-8deg]">
          <Trophy className="h-14 w-14 text-amber-700" strokeWidth={1} />
        </div>
        <div className="absolute -bottom-2 right-16 opacity-[0.12] pointer-events-none rotate-[10deg]">
          <Trophy className="h-11 w-11 text-amber-700" strokeWidth={1} />
        </div>

        {/* Envelope seal/stamp decoration */}
        <div 
          className="absolute top-4 right-3 w-8 h-8 rounded-full flex items-center justify-center opacity-40"
          style={{ 
            background: 'radial-gradient(circle, #b45309 0%, #92400e 100%)',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)'
          }}
        >
          <Award className="h-4 w-4 text-amber-100" />
        </div>

        {/* Content */}
        <div className="relative flex items-start gap-3 pr-14 mt-2">
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

        {/* Bottom envelope edge detail */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(180, 83, 9, 0.2) 50%, transparent 100%)' }}
        />
      </div>
    </div>
  );
}
