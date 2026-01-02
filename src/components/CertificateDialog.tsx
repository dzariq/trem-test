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

// Geometric Chevron Background Layer - Green
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

// Consistent Star Seal with uniform sharp points
const StarSeal = ({ className }: { className?: string }) => {
  // Generate 16-point star with consistent sharp points
  const generateStarPoints = (cx: number, cy: number, outerR: number, innerR: number, points: number) => {
    const step = Math.PI / points;
    const path = [];
    for (let i = 0; i < 2 * points; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = i * step - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      path.push(`${x},${y}`);
    }
    return path.join(' ');
  };

  return (
    <div className={`relative ${className}`}>
      <svg 
        viewBox="0 0 100 100" 
        className="w-28 h-28 sm:w-32 sm:h-32"
      >
        <defs>
          <linearGradient id="sealGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f0d878"/>
            <stop offset="50%" stopColor="#d4a537"/>
            <stop offset="100%" stopColor="#c9942a"/>
          </linearGradient>
          <linearGradient id="sealInner" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1a3d2e"/>
            <stop offset="100%" stopColor="#0f2318"/>
          </linearGradient>
        </defs>
        {/* Outer star burst - 16 consistent sharp points */}
        <polygon 
          points={generateStarPoints(50, 50, 50, 35, 16)}
          fill="url(#sealGold)"
        />
        {/* Inner circle */}
        <circle cx="50" cy="50" r="26" fill="url(#sealInner)" stroke="#d4a537" strokeWidth="2"/>
        {/* Inner gold ring */}
        <circle cx="50" cy="50" r="20" fill="none" stroke="rgba(212, 165, 55, 0.5)" strokeWidth="1"/>
      </svg>
      {/* School Logo in center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img 
          src={schoolLogo} 
          alt="School Logo" 
          className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
        />
      </div>
    </div>
  );
};

// Small decorative star
const SmallStar = ({ className, size = 12 }: { className?: string; size?: number }) => (
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

// Single Large Logo Background - Right Bottom Corner
const LargeLogoBackground = ({ className }: { className?: string }) => (
  <div 
    className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
  >
    <img 
      src={schoolLogo} 
      alt="" 
      className="absolute -right-24 -bottom-24 w-[400px] h-[400px] sm:w-[480px] sm:h-[480px] object-contain opacity-[0.07]"
    />
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

  // Format full date
  const fullDate = `January 15, ${year}`;

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

        {/* Certificate Container - Portrait - Dark Green */}
        <div 
          className="relative w-full overflow-hidden print:p-8"
          style={{
            aspectRatio: '3/4',
            background: 'linear-gradient(180deg, #1a3d2e 0%, #0f2318 100%)',
            boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.6)',
          }}
        >
            {/* Single Large Logo Background */}
            <LargeLogoBackground />

          {/* Top Geometric Layers - Green tones */}
          <div className="absolute top-0 left-0 right-0 z-[1]">
            <ChevronLayer 
              className="w-full h-24 sm:h-28" 
              color="#2d5a47" 
              opacity={0.3}
              position="top"
            />
            <ChevronLayer 
              className="w-full h-20 sm:h-24 -mt-16 sm:-mt-20" 
              color="#24503e" 
              opacity={0.5}
              position="top"
            />
            <ChevronLayer 
              className="w-full h-16 sm:h-20 -mt-12 sm:-mt-16" 
              color="#1a4535" 
              opacity={0.7}
              position="top"
            />
          </div>

          {/* Bottom Geometric Layers - Green tones */}
          <div className="absolute bottom-0 left-0 right-0 z-[1]">
            <ChevronLayer 
              className="w-full h-16 sm:h-20" 
              color="#1a4535" 
              opacity={0.7}
              position="bottom"
            />
            <ChevronLayer 
              className="w-full h-20 sm:h-24 -mb-12 sm:-mb-16 absolute bottom-0" 
              color="#24503e" 
              opacity={0.5}
              position="bottom"
            />
          </div>

          {/* Certificate Content */}
          <div className="relative h-full flex flex-col items-center py-6 sm:py-8 px-6 sm:px-10 text-center z-10">
            
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

            {/* V-Shaped Gold Ribbon with Star Seal at the V-point */}
            <div className="relative w-[140%] -mx-[20%] mt-4">
              <VRibbon className="w-full h-14 sm:h-16" />
              {/* Star Seal positioned at the V-point of the ribbon */}
              <div className="absolute left-1/2 -translate-x-1/2 top-[-15%]">
                <StarSeal />
              </div>
            </div>

            {/* Spacer for the seal */}
            <div className="h-16 sm:h-20" />

            {/* Proudly Presented - right after the seal */}
            <p 
              className="text-xs sm:text-sm uppercase tracking-[0.2em] font-medium -mt-2"
              style={{ color: '#d4a537' }}
            >
              Proudly Presented To
            </p>

            {/* Main Content */}
            <div className="flex flex-col items-center gap-1 sm:gap-2 flex-1 justify-center">
              
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
                <SmallStar className="text-[#d4a537]" size={8} />
                <div className="w-12 sm:w-16 h-[1px]" style={{ background: 'linear-gradient(to left, transparent, #d4a537)' }} />
              </div>

              {/* Role - Big and Prominent */}
              <h4 
                className="text-2xl sm:text-3xl font-bold font-certificate-title uppercase tracking-wide mt-1"
                style={{ 
                  color: '#e8c967',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                {role}
              </h4>
              
              {/* Organization - Big and Prominent */}
              <h5 
                className="text-xl sm:text-2xl font-semibold font-certificate-title"
                style={{ color: '#d4a537' }}
              >
                {organization}
              </h5>
            </div>

            {/* Footer Section - Two Signatures + Full Date */}
            <div className="w-full flex flex-col items-center gap-3 mt-auto">
              {/* Full Date centered above signatures */}
              <p 
                className="text-xs sm:text-sm font-certificate-body"
                style={{ color: 'rgba(212, 165, 55, 0.8)' }}
              >
                {fullDate}
              </p>
              
              {/* Two Signatures */}
              <div className="w-full flex items-end justify-between px-4 sm:px-8">
                {/* Signature 1 */}
                <div className="text-center flex-1">
                  <div 
                    className="w-20 sm:w-24 h-[1px] mb-2 mx-auto" 
                    style={{ backgroundColor: 'rgba(212, 165, 55, 0.5)' }} 
                  />
                  <p 
                    className="text-[10px] sm:text-xs uppercase tracking-wider"
                    style={{ color: 'rgba(212, 165, 55, 0.7)' }}
                  >
                    Principal
                  </p>
                </div>
                
                {/* Signature 2 */}
                <div className="text-center flex-1">
                  <div 
                    className="w-20 sm:w-24 h-[1px] mb-2 mx-auto" 
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
        </div>

        {/* Download Button - Dark Green Theme */}
        <Button 
          onClick={handleDownload}
          className="gap-2 shadow-xl print:hidden px-8 py-6 text-base hover:scale-105 transition-all duration-300 rounded-full font-medium"
          style={{ 
            background: 'linear-gradient(135deg, #1a3d2e 0%, #0f2318 100%)',
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
