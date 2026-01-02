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

// Geometric Chevron Background Layer - Now Green
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

// Star Seal Component
const StarSeal = ({ className }: { className?: string }) => (
  <div className={`relative ${className}`}>
    {/* Multi-pointed star seal */}
    <svg 
      viewBox="0 0 100 100" 
      className="w-28 h-28 sm:w-32 sm:h-32"
    >
      <defs>
        <linearGradient id="sealGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8c967"/>
          <stop offset="50%" stopColor="#d4a537"/>
          <stop offset="100%" stopColor="#c9942a"/>
        </linearGradient>
        <linearGradient id="sealInner" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a3d2e"/>
          <stop offset="100%" stopColor="#0f2318"/>
        </linearGradient>
      </defs>
      {/* Outer star burst - 16 points */}
      <polygon 
        points="50,0 54,20 62,4 58,24 74,10 66,28 86,18 74,32 96,28 80,38 100,50 80,62 96,72 74,68 86,82 66,72 74,90 58,76 62,96 54,80 50,100 46,80 38,96 42,76 26,90 34,72 14,82 26,68 4,72 20,62 0,50 20,38 4,28 26,32 14,18 34,28 26,10 42,24 38,4 46,20"
        fill="url(#sealGold)"
      />
      {/* Inner circle */}
      <circle cx="50" cy="50" r="28" fill="url(#sealInner)" stroke="#d4a537" strokeWidth="2"/>
      {/* Inner gold ring */}
      <circle cx="50" cy="50" r="22" fill="none" stroke="rgba(212, 165, 55, 0.4)" strokeWidth="1"/>
    </svg>
    {/* School Logo in center */}
    <div className="absolute inset-0 flex items-center justify-center">
      <img 
        src={schoolLogo} 
        alt="School Logo" 
        className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
      />
    </div>
  </div>
);

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

        {/* Certificate Container - Portrait - Dark Green */}
        <div 
          className="relative w-full overflow-hidden print:p-8"
          style={{
            aspectRatio: '3/4',
            background: 'linear-gradient(180deg, #1a3d2e 0%, #0f2318 100%)',
            boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.6)',
          }}
        >
          {/* Top Geometric Layers - Green tones */}
          <div className="absolute top-0 left-0 right-0">
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
          <div className="absolute bottom-0 left-0 right-0">
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

            {/* V-Shaped Gold Ribbon - Full Width Edge to Edge */}
            <div className="w-[140%] -mx-[20%] -my-1">
              <VRibbon className="w-full h-14 sm:h-16" />
            </div>

            {/* Star Seal */}
            <StarSeal className="z-10 -my-4" />

            {/* Main Content - Moved up with proper spacing */}
            <div className="flex flex-col items-center gap-1 sm:gap-2 mt-2">
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

            {/* Footer Section - Two Signatures + Date */}
            <div className="w-full flex flex-col items-center gap-3 mt-auto">
              {/* Date centered above signatures */}
              <p 
                className="text-xs sm:text-sm font-certificate-body"
                style={{ color: 'rgba(212, 165, 55, 0.8)' }}
              >
                {year}
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
