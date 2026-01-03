import { useRef } from "react";
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
    <div 
      className={`relative ${className}`}
      style={{
        filter: 'drop-shadow(0 8px 20px rgba(212, 165, 55, 0.4)) drop-shadow(0 4px 10px rgba(0, 0, 0, 0.3))'
      }}
    >
      <svg 
        viewBox="0 0 100 100" 
        className="w-32 h-32"
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
          className="w-12 h-12 object-contain"
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

// Single Large Logo Background - Right Bottom Corner with gradient transparency
const LargeLogoBackground = ({ className }: { className?: string }) => (
  <div 
    className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
  >
    <img 
      src={schoolLogo} 
      alt="" 
      className="absolute -right-24 -bottom-24 w-[480px] h-[480px] object-contain"
      style={{
        opacity: 0.10,
        maskImage: 'linear-gradient(135deg, transparent 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,1) 100%)',
        WebkitMaskImage: 'linear-gradient(135deg, transparent 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,1) 100%)',
      }}
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
  const certificateRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const printContent = certificateRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificate - ${studentName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Inter', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: #f5f5f5;
            }
            
            .certificate-container {
              width: 420px;
              height: 594px;
            }
            
            @page {
              size: A4 portrait;
              margin: 0;
            }
            
            @media print {
              body { 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact; 
                background: white;
              }
              .certificate-container {
                width: 100%;
                height: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="certificate-container">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  };

  // Format full date
  const fullDate = `January 15, ${year}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-none w-auto p-4 sm:p-6 overflow-auto bg-background border-none flex flex-col items-center gap-4 max-h-[90vh]"
        hideClose
      >
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-2 right-2 z-50 p-2 rounded-full bg-muted hover:bg-accent transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Certificate Container Wrapper - keeps certificate centered and in portrait */}
        <div className="flex items-center justify-center w-full overflow-auto py-4">
          {/* Certificate Container - Fixed A4 ratio (210mm x 297mm = 1:1.414) */}
          <div 
            ref={certificateRef}
            className="relative overflow-hidden flex-shrink-0 print:p-8"
            style={{
              width: '320px',
              height: '453px', // A4 ratio: 320 * 1.414 = 453
              background: 'linear-gradient(180deg, #1a3d2e 0%, #0f2318 100%)',
              boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.6)',
              border: '3px solid #d4a537',
              outline: '1px solid rgba(212, 165, 55, 0.3)',
              outlineOffset: '4px',
            }}
          >
            {/* Single Large Logo Background */}
            <LargeLogoBackground />

            {/* Top Geometric Layers - Green tones */}
            <div className="absolute top-0 left-0 right-0 z-[1]">
              <ChevronLayer 
                className="w-full h-20" 
                color="#2d5a47" 
                opacity={0.3}
                position="top"
              />
              <ChevronLayer 
                className="w-full h-16 -mt-14" 
                color="#24503e" 
                opacity={0.5}
                position="top"
              />
              <ChevronLayer 
                className="w-full h-14 -mt-10" 
                color="#1a4535" 
                opacity={0.7}
                position="top"
              />
            </div>

            {/* Bottom Geometric Layers - Green tones */}
            <div className="absolute bottom-0 left-0 right-0 z-[1]">
              <ChevronLayer 
                className="w-full h-14" 
                color="#1a4535" 
                opacity={0.7}
                position="bottom"
              />
              <ChevronLayer 
                className="w-full h-16 -mb-10 absolute bottom-0" 
                color="#24503e" 
                opacity={0.5}
                position="bottom"
              />
            </div>

            {/* Certificate Content */}
            <div className="relative h-full flex flex-col items-center py-6 px-6 text-center z-10">
              
              {/* Header Section */}
              <div className="flex flex-col items-center gap-0.5">
                {/* Big Year at Top */}
                <h1 
                  className="text-4xl font-bold tracking-wider font-certificate-title"
                  style={{ 
                    color: '#d4a537',
                    textShadow: '0 4px 8px rgba(0,0,0,0.3)'
                  }}
                >
                  {year}
                </h1>
                
                {/* Certificate Title */}
                <h2 
                  className="text-2xl italic tracking-wide font-certificate-script mt-0.5"
                  style={{ color: '#e8c967' }}
                >
                  Certificate
                </h2>
                <p 
                  className="text-xs uppercase tracking-[0.3em] font-medium"
                  style={{ color: '#d4a537' }}
                >
                  of Achievement
                </p>
              </div>

              {/* V-Shaped Gold Ribbon with Star Seal at the V-point */}
              <div className="relative w-[140%] -mx-[20%] mt-3">
                <VRibbon className="w-full h-12" />
                {/* Star Seal positioned at the V-point of the ribbon */}
                <div className="absolute left-1/2 -translate-x-1/2 top-[-15%] scale-75">
                  <StarSeal />
                </div>
              </div>

              {/* Spacer for the seal */}
              <div className="h-14" />

              {/* Proudly Presented - right after the seal */}
              <p 
                className="text-xs uppercase tracking-[0.2em] font-medium -mt-2"
                style={{ color: '#d4a537' }}
              >
                Proudly Presented To
              </p>

              {/* Main Content */}
              <div className="flex flex-col items-center gap-1.5 flex-1 justify-center">
                
                {/* Student Name */}
                <h3 
                  className="text-2xl font-certificate-script px-2"
                  style={{ 
                    color: '#e8c967',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}
                >
                  {studentName}
                </h3>
                
                {/* Decorative line under name */}
                <div className="flex items-center gap-2">
                  <div className="w-12 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, #d4a537)' }} />
                  <SmallStar className="text-[#d4a537]" size={6} />
                  <div className="w-12 h-[1px]" style={{ background: 'linear-gradient(to left, transparent, #d4a537)' }} />
                </div>

                {/* Role - Big and Prominent */}
                <h4 
                  className="text-xl font-bold font-certificate-title uppercase tracking-wide mt-1"
                  style={{ 
                    color: '#e8c967',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}
                >
                  {role}
                </h4>
                
                {/* Organization - Big and Prominent */}
                <h5 
                  className="text-lg font-semibold font-certificate-title"
                  style={{ color: '#d4a537' }}
                >
                  {organization}
                </h5>
              </div>

              {/* Footer Section - Two Signatures + Full Date */}
              <div className="w-full flex flex-col items-center gap-2 mt-auto">
                {/* Full Date centered above signatures */}
                <p 
                  className="text-xs font-certificate-body"
                  style={{ color: 'rgba(212, 165, 55, 0.8)' }}
                >
                  {fullDate}
                </p>
                
                {/* Two Signatures */}
                <div className="w-full flex items-end justify-between px-4">
                  {/* Signature 1 */}
                  <div className="text-center flex-1">
                    <div 
                      className="w-16 h-[1px] mb-1.5 mx-auto" 
                      style={{ backgroundColor: 'rgba(212, 165, 55, 0.5)' }} 
                    />
                    <p 
                      className="text-[10px] uppercase tracking-wider"
                      style={{ color: 'rgba(212, 165, 55, 0.7)' }}
                    >
                      Principal
                    </p>
                  </div>
                  
                  {/* Signature 2 */}
                  <div className="text-center flex-1">
                    <div 
                      className="w-16 h-[1px] mb-1.5 mx-auto" 
                      style={{ backgroundColor: 'rgba(212, 165, 55, 0.5)' }} 
                    />
                    <p 
                      className="text-[10px] uppercase tracking-wider"
                      style={{ color: 'rgba(212, 165, 55, 0.7)' }}
                    >
                      Director
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Download Button - Dark Green Theme */}
        <Button 
          onClick={handleDownload}
          className="gap-2 shadow-xl print:hidden px-6 py-5 text-sm hover:scale-105 transition-all duration-300 rounded-full font-medium"
          style={{ 
            background: 'linear-gradient(135deg, #1a3d2e 0%, #0f2318 100%)',
            color: '#e8c967',
            border: '1px solid #d4a537',
            boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)'
          }}
        >
          <Download className="h-4 w-4" />
          Download Certificate
        </Button>
      </DialogContent>
    </Dialog>
  );
}
