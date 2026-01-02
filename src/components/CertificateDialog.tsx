import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import schoolLogo from "@/assets/school-badge.png";

interface CertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string;
  organization: string;
  role: string;
  studentName: string;
  year?: string;
}

// Geometric Chevron Background Layer
const ChevronLayer = ({ 
  className, 
  color, 
  opacity = 1,
  position = 'top'
}: { 
  className?: string; 
  color: string; 
  opacity?: number;
  position?: 'top' | 'bottom';
}) => (
  <svg 
    viewBox="0 0 400 120" 
    className={className}
    preserveAspectRatio="none"
    style={{ opacity }}
  >
    {position === 'top' ? (
      <polygon points="0,0 400,0 400,60 200,120 0,60" fill={color}/>
    ) : (
      <polygon points="0,60 200,0 400,60 400,120 0,120" fill={color}/>
    )}
  </svg>
);

// V-Shaped Ribbon Banner
const VRibbon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 400 80" 
    className={className}
    preserveAspectRatio="none"
  >
    <defs>
      <linearGradient id="ribbonGold" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#e8c967"/>
        <stop offset="50%" stopColor="#d4a537"/>
        <stop offset="100%" stopColor="#c9942a"/>
      </linearGradient>
      <linearGradient id="ribbonShadow" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#c9942a"/>
        <stop offset="100%" stopColor="#a67c1a"/>
      </linearGradient>
    </defs>
    {/* Main ribbon body */}
    <polygon points="0,25 200,55 400,25 400,45 200,75 0,45" fill="url(#ribbonGold)"/>
    {/* Bottom shadow */}
    <polygon points="0,45 200,75 400,45 400,50 200,80 0,50" fill="url(#ribbonShadow)"/>
    {/* Top highlight */}
    <polygon points="0,22 200,52 400,22 400,25 200,55 0,25" fill="#f0d878" opacity="0.6"/>
  </svg>
);

// Decorative Stars
const Star = ({ className, size = 12 }: { className?: string; size?: number }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className}
    width={size}
    height={size}
    fill="currentColor"
  >
    <polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9"/>
  </svg>
);

// Award Badge Component
const AwardBadge = ({ category, className }: { category: string; className?: string }) => (
  <div className={`relative ${className}`}>
    {/* Outer decorative ring with stars */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative w-full h-full">
        {/* Stars around the badge */}
        <Star className="absolute -top-1 left-1/2 -translate-x-1/2 text-[#d4a537]" size={10} />
        <Star className="absolute top-2 -left-1 text-[#d4a537]" size={8} />
        <Star className="absolute top-2 -right-1 text-[#d4a537]" size={8} />
        <Star className="absolute bottom-2 -left-1 text-[#d4a537]" size={8} />
        <Star className="absolute bottom-2 -right-1 text-[#d4a537]" size={8} />
        <Star className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[#d4a537]" size={10} />
      </div>
    </div>
    
    {/* Main badge circle */}
    <div 
      className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center"
      style={{ 
        background: 'linear-gradient(145deg, #1a2942 0%, #0f1729 100%)',
        border: '3px solid #d4a537',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4), inset 0 0 20px rgba(212, 165, 55, 0.1)'
      }}
    >
      {/* Inner gold ring */}
      <div 
        className="absolute inset-2 rounded-full"
        style={{ border: '1px solid rgba(212, 165, 55, 0.4)' }}
      />
      
      {/* Badge content */}
      <span 
        className="text-[10px] sm:text-xs uppercase tracking-wider font-medium"
        style={{ color: '#d4a537' }}
      >
        Award
      </span>
      <span 
        className="text-xs sm:text-sm font-bold text-center px-2 leading-tight mt-0.5"
        style={{ color: '#e8c967' }}
      >
        {category}
      </span>
    </div>
  </div>
);

export function CertificateDialog({
  open,
  onOpenChange,
  category,
  organization,
  role,
  studentName,
  year = "2025",
}: CertificateDialogProps) {
  const handleDownload = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-[95vw] w-[420px] sm:w-[480px] p-0 overflow-visible bg-transparent border-none flex flex-col items-center gap-4"
        hideClose
      >
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute -top-2 -right-2 z-50 p-2 rounded-full bg-background shadow-lg hover:bg-accent transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Certificate Container - Portrait */}
        <div 
          className="relative w-full overflow-hidden print:p-8"
          style={{
            aspectRatio: '3/4',
            background: 'linear-gradient(180deg, #1a2942 0%, #0f1729 100%)',
            boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.6)',
          }}
        >
          {/* Top Geometric Layers */}
          <div className="absolute top-0 left-0 right-0">
            <ChevronLayer 
              className="w-full h-24 sm:h-28" 
              color="#3b5998" 
              opacity={0.3}
              position="top"
            />
            <ChevronLayer 
              className="w-full h-20 sm:h-24 -mt-16 sm:-mt-20" 
              color="#2c4a7d" 
              opacity={0.5}
              position="top"
            />
            <ChevronLayer 
              className="w-full h-16 sm:h-20 -mt-12 sm:-mt-16" 
              color="#1a3a6e" 
              opacity={0.7}
              position="top"
            />
          </div>

          {/* Bottom Geometric Layers */}
          <div className="absolute bottom-0 left-0 right-0">
            <ChevronLayer 
              className="w-full h-16 sm:h-20" 
              color="#1a3a6e" 
              opacity={0.7}
              position="bottom"
            />
            <ChevronLayer 
              className="w-full h-20 sm:h-24 -mb-12 sm:-mb-16 absolute bottom-0" 
              color="#2c4a7d" 
              opacity={0.5}
              position="bottom"
            />
          </div>

          {/* Certificate Content */}
          <div className="relative h-full flex flex-col items-center justify-between py-6 sm:py-8 px-6 sm:px-10 text-center z-10">
            
            {/* Header Section */}
            <div className="flex flex-col items-center gap-1">
              {/* Big Year at Top */}
              <h1 
                className="text-5xl sm:text-6xl font-bold tracking-wider font-certificate-title"
                style={{ 
                  color: '#d4a537',
                  textShadow: '0 4px 8px rgba(0,0,0,0.3)'
                }}
              >
                {year}
              </h1>
              
              {/* Certificate Title */}
              <h2 
                className="text-2xl sm:text-3xl italic tracking-wide font-certificate-script mt-1"
                style={{ color: '#e8c967' }}
              >
                Certificate
              </h2>
              <p 
                className="text-xs sm:text-sm uppercase tracking-[0.3em] font-medium"
                style={{ color: '#d4a537' }}
              >
                of Achievement
              </p>
            </div>

            {/* V-Shaped Gold Ribbon */}
            <div className="w-full -my-2">
              <VRibbon className="w-full h-12 sm:h-16" />
            </div>

            {/* Award Badge */}
            <AwardBadge category={category} className="z-10 -my-2" />

            {/* Main Content */}
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <p 
                className="text-xs sm:text-sm uppercase tracking-[0.2em] font-medium"
                style={{ color: '#d4a537' }}
              >
                Proudly Presented To
              </p>
              
              {/* Student Name */}
              <h3 
                className="text-3xl sm:text-4xl font-certificate-script px-4"
                style={{ 
                  color: '#e8c967',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                {studentName}
              </h3>
              
              {/* Decorative line under name */}
              <div className="flex items-center gap-3">
                <div className="w-12 sm:w-16 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, #d4a537)' }} />
                <Star className="text-[#d4a537]" size={8} />
                <div className="w-12 sm:w-16 h-[1px]" style={{ background: 'linear-gradient(to left, transparent, #d4a537)' }} />
              </div>

              {/* Achievement Description */}
              <p 
                className="text-xs sm:text-sm leading-relaxed max-w-xs font-certificate-body"
                style={{ color: 'rgba(255,255,255,0.8)' }}
              >
                For outstanding contribution as <span style={{ color: '#e8c967' }}>{role}</span> of {organization}
              </p>
            </div>

            {/* Footer Section */}
            <div className="w-full flex items-end justify-between px-2 sm:px-4 mt-auto">
              {/* Date */}
              <div className="text-center flex-1">
                <div 
                  className="w-16 sm:w-20 h-[1px] mb-2 mx-auto" 
                  style={{ backgroundColor: 'rgba(212, 165, 55, 0.5)' }} 
                />
                <p 
                  className="text-[10px] sm:text-xs uppercase tracking-wider"
                  style={{ color: 'rgba(212, 165, 55, 0.7)' }}
                >
                  Date
                </p>
              </div>

              {/* School Logo */}
              <div className="flex flex-col items-center px-4">
                <img 
                  src={schoolLogo} 
                  alt="School Logo" 
                  className="h-10 w-auto sm:h-12 opacity-80"
                />
              </div>
              
              {/* Signature */}
              <div className="text-center flex-1">
                <div 
                  className="w-16 sm:w-20 h-[1px] mb-2 mx-auto" 
                  style={{ backgroundColor: 'rgba(212, 165, 55, 0.5)' }} 
                />
                <p 
                  className="text-[10px] sm:text-xs uppercase tracking-wider"
                  style={{ color: 'rgba(212, 165, 55, 0.7)' }}
                >
                  Director
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Download Button - Dark Navy Theme */}
        <Button 
          onClick={handleDownload}
          className="gap-2 shadow-xl print:hidden px-8 py-6 text-base hover:scale-105 transition-all duration-300 rounded-full font-medium"
          style={{ 
            background: 'linear-gradient(135deg, #1a2942 0%, #0f1729 100%)',
            color: '#e8c967',
            border: '1px solid #d4a537',
            boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)'
          }}
        >
          <Download className="h-5 w-5" />
          Download Certificate
        </Button>
      </DialogContent>
    </Dialog>
  );
}
