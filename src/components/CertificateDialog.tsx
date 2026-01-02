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

// Decorative Flourish SVG Component
const Flourish = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 200 20" 
    className={className}
    fill="currentColor"
  >
    <path d="M0 10 Q25 0, 50 10 T100 10 T150 10 T200 10" stroke="currentColor" strokeWidth="1" fill="none"/>
    <circle cx="100" cy="10" r="3"/>
    <path d="M85 10 Q92 5, 100 10 T115 10" stroke="currentColor" strokeWidth="1" fill="none"/>
  </svg>
);

// Laurel Wreath SVG Component
const LaurelWreath = ({ className, side }: { className?: string; side: 'left' | 'right' }) => (
  <svg 
    viewBox="0 0 40 80" 
    className={className}
    fill="currentColor"
    style={{ transform: side === 'right' ? 'scaleX(-1)' : undefined }}
  >
    <path d="M35 10 Q30 20, 32 30 Q28 25, 30 15 Q25 20, 28 30 Q22 22, 25 12 Q18 18, 22 28 Q15 18, 18 8" 
      stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.8"/>
    <path d="M35 35 Q30 45, 32 55 Q28 50, 30 40 Q25 45, 28 55 Q22 47, 25 37 Q18 43, 22 53 Q15 43, 18 33" 
      stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.8"/>
    <path d="M32 60 Q28 68, 30 75 Q25 70, 27 62 Q20 68, 23 75 Q16 66, 20 58" 
      stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.8"/>
  </svg>
);

// Corner Ornament SVG Component
const CornerOrnament = ({ className, position }: { className?: string; position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) => {
  const transforms: Record<string, string> = {
    'top-left': '',
    'top-right': 'scaleX(-1)',
    'bottom-left': 'scaleY(-1)',
    'bottom-right': 'scale(-1)',
  };
  
  return (
    <svg 
      viewBox="0 0 60 60" 
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      style={{ transform: transforms[position] }}
    >
      <path d="M5 5 L5 25 Q5 35, 15 40 Q25 45, 35 40 Q45 35, 50 25 L55 5" strokeOpacity="0.6"/>
      <path d="M8 8 L8 22 Q8 30, 16 34 Q24 38, 32 34 Q40 30, 44 22 L48 8" strokeOpacity="0.4"/>
      <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.5"/>
      <path d="M15 5 Q20 15, 15 25" strokeOpacity="0.3"/>
    </svg>
  );
};

// Certificate Serial Number Generator
const generateSerialNumber = (year: string) => {
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `CERT-${year}-${random}`;
};

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

  const serialNumber = generateSerialNumber(year);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-[95vw] w-[800px] p-0 overflow-visible bg-transparent border-none flex flex-col items-center gap-4"
        hideClose
      >
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute -top-2 -right-2 z-50 p-2 rounded-full bg-background shadow-lg hover:bg-accent transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Certificate Container - Landscape */}
        <div 
          className="relative w-full aspect-[1.414/1] overflow-hidden print:p-8 rounded-sm"
          style={{
            background: 'linear-gradient(145deg, #fffbeb 0%, #fef3c7 30%, #fde68a 70%, #fcd34d 100%)',
            boxShadow: '0 25px 60px -12px rgba(120, 53, 15, 0.4), 0 0 0 1px rgba(217, 119, 6, 0.3), inset 0 0 100px rgba(255, 255, 255, 0.3)',
          }}
        >
          {/* Paper Texture Overlay */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Outer Ornate Border */}
          <div 
            className="absolute inset-2 sm:inset-3 pointer-events-none rounded-sm"
            style={{ 
              border: '4px double #92400e',
              background: 'transparent'
            }}
          />
          
          {/* Inner Decorative Border */}
          <div 
            className="absolute inset-4 sm:inset-6 pointer-events-none rounded-sm"
            style={{ 
              border: '2px solid #b45309',
              boxShadow: 'inset 0 0 30px rgba(180, 83, 9, 0.08), 0 0 20px rgba(180, 83, 9, 0.05)'
            }}
          />

          {/* Filigree pattern border */}
          <div 
            className="absolute inset-5 sm:inset-7 pointer-events-none"
            style={{ 
              border: '1px dashed rgba(180, 83, 9, 0.3)',
            }}
          />

          {/* Corner Ornaments */}
          <CornerOrnament className="absolute top-4 left-4 w-12 h-12 sm:w-16 sm:h-16 text-amber-800" position="top-left" />
          <CornerOrnament className="absolute top-4 right-4 w-12 h-12 sm:w-16 sm:h-16 text-amber-800" position="top-right" />
          <CornerOrnament className="absolute bottom-4 left-4 w-12 h-12 sm:w-16 sm:h-16 text-amber-800" position="bottom-left" />
          <CornerOrnament className="absolute bottom-4 right-4 w-12 h-12 sm:w-16 sm:h-16 text-amber-800" position="bottom-right" />

          {/* Watermark Logo - Bottom Right, More Visible */}
          <div 
            className="absolute bottom-12 right-12 sm:bottom-16 sm:right-16 pointer-events-none opacity-[0.06]"
          >
            <img 
              src={schoolLogo} 
              alt="" 
              className="w-36 sm:w-48 h-auto"
            />
          </div>

          {/* Certificate Content */}
          <div className="relative h-full flex flex-col items-center justify-between py-6 sm:py-8 px-8 sm:px-14 text-center">
            {/* Header with Larger Logo and Laurel Wreaths */}
            <div className="flex flex-col items-center gap-1 sm:gap-2 relative">
              {/* Laurel Wreaths around logo */}
              <div className="relative flex items-center justify-center">
                <LaurelWreath className="absolute -left-8 sm:-left-12 top-0 w-8 h-16 sm:w-10 sm:h-20 text-amber-700" side="left" />
                <img 
                  src={schoolLogo} 
                  alt="School Logo" 
                  className="h-16 w-auto sm:h-20 drop-shadow-lg relative z-10"
                />
                <LaurelWreath className="absolute -right-8 sm:-right-12 top-0 w-8 h-16 sm:w-10 sm:h-20 text-amber-700" side="right" />
              </div>
              
              {/* School Name */}
              <p 
                className="text-[10px] sm:text-xs uppercase tracking-[0.2em] font-medium mt-1"
                style={{ color: '#92400e' }}
              >
                Excellence in Education
              </p>
              
              {/* Title with premium font */}
              <h1 
                className="text-2xl sm:text-4xl font-semibold tracking-wide mt-1 font-certificate-title"
                style={{ 
                  color: '#78350f',
                  textShadow: '0 2px 4px rgba(120, 53, 15, 0.15)'
                }}
              >
                Certificate of Achievement
              </h1>
              
              {/* Decorative flourish under title */}
              <Flourish className="w-32 sm:w-48 h-4 text-amber-700 mt-1" />
            </div>

            {/* Body */}
            <div className="flex-1 flex flex-col items-center justify-center gap-2 sm:gap-3 max-w-lg -mt-4">
              <p 
                className="text-sm sm:text-lg italic font-certificate-body"
                style={{ color: '#92400e' }}
              >
                This is to certify that
              </p>
              
              {/* Student Name with elegant script font */}
              <div className="relative">
                <h2 
                  className="text-3xl sm:text-5xl px-8 py-1 font-certificate-script"
                  style={{ 
                    color: '#78350f',
                    textShadow: '0 2px 4px rgba(120, 53, 15, 0.1)'
                  }}
                >
                  {studentName}
                </h2>
                {/* Elegant underline with ornaments */}
                <div className="flex items-center justify-center gap-2 mt-1">
                  <div className="w-8 sm:w-12 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, #b45309)' }} />
                  <svg viewBox="0 0 20 10" className="w-4 h-2 text-amber-700" fill="currentColor">
                    <path d="M10 0 L20 5 L10 10 L0 5 Z" opacity="0.6"/>
                  </svg>
                  <div className="w-8 sm:w-12 h-[1px]" style={{ background: 'linear-gradient(to left, transparent, #b45309)' }} />
                </div>
              </div>

              <p 
                className="text-xs sm:text-base mt-1 font-certificate-body"
                style={{ color: '#92400e' }}
              >
                has been recognized for outstanding contribution as
              </p>

              <div className="space-y-0.5 mt-1">
                <h3 
                  className="text-xl sm:text-3xl font-bold font-certificate-title"
                  style={{ 
                    color: '#b45309',
                    textShadow: '0 1px 2px rgba(180, 83, 9, 0.1)'
                  }}
                >
                  {role}
                </h3>
                <p 
                  className="text-base sm:text-xl font-semibold font-certificate-body" 
                  style={{ color: '#78350f' }}
                >
                  {organization}
                </p>
              </div>

              {/* Category in Elegant Script */}
              <div className="flex items-center gap-3 mt-2">
                <div className="w-8 sm:w-16 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, rgba(180, 83, 9, 0.4))' }} />
                <p 
                  className="text-xl sm:text-3xl font-certificate-script"
                  style={{ 
                    color: getCategoryColor(category).text,
                    textShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                >
                  {category}
                </p>
                <div className="w-8 sm:w-16 h-[1px]" style={{ background: 'linear-gradient(to left, transparent, rgba(180, 83, 9, 0.4))' }} />
              </div>
            </div>

            {/* Footer with Signatures and Enhanced Seal */}
            <div className="w-full flex items-end justify-between px-4 sm:px-8 mt-2">
              <div className="text-center">
                <div 
                  className="w-20 sm:w-28 h-[1px] mb-1 mx-auto" 
                  style={{ backgroundColor: '#78350f' }} 
                />
                <p className="text-[10px] sm:text-xs font-medium font-certificate-body" style={{ color: '#78350f' }}>Date</p>
                <p 
                  className="text-xs sm:text-sm font-certificate-body italic" 
                  style={{ color: '#92400e' }}
                >
                  {year}
                </p>
              </div>
              
              {/* Enhanced Gold Seal with Ribbon */}
              <div className="relative">
                {/* Ribbon tails */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-0">
                  <div 
                    className="w-4 h-8 sm:w-5 sm:h-10 -rotate-12 origin-top"
                    style={{ 
                      background: 'linear-gradient(180deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
                      clipPath: 'polygon(0 0, 100% 0, 100% 80%, 50% 100%, 0 80%)'
                    }}
                  />
                  <div 
                    className="w-4 h-8 sm:w-5 sm:h-10 rotate-12 origin-top -ml-2"
                    style={{ 
                      background: 'linear-gradient(180deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
                      clipPath: 'polygon(0 0, 100% 0, 100% 80%, 50% 100%, 0 80%)'
                    }}
                  />
                </div>
                
                {/* Main seal */}
                <div 
                  className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center z-10"
                  style={{ 
                    background: 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 30%, #d97706 60%, #b45309 100%)',
                    boxShadow: '0 4px 12px rgba(180, 83, 9, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.4), inset 0 -2px 4px rgba(120, 53, 15, 0.3)'
                  }}
                >
                  {/* Inner ring */}
                  <div 
                    className="absolute inset-1 sm:inset-1.5 rounded-full"
                    style={{ 
                      border: '2px solid rgba(254, 243, 199, 0.4)',
                    }}
                  />
                  {/* Innermost circle with logo */}
                  <div 
                    className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 flex items-center justify-center overflow-hidden"
                    style={{ 
                      borderColor: 'rgba(254, 243, 199, 0.5)',
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.1), transparent)'
                    }}
                  >
                    <img 
                      src={schoolLogo} 
                      alt="Seal" 
                      className="w-6 h-6 sm:w-8 sm:h-8 opacity-90"
                    />
                  </div>
                  
                  {/* Embossed text around seal */}
                  <div 
                    className="absolute inset-0 rounded-full flex items-center justify-center"
                    style={{ 
                      background: 'conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.1) 25%, transparent 50%, rgba(255,255,255,0.1) 75%, transparent 100%)'
                    }}
                  />
                </div>
              </div>
              
              <div className="text-center">
                <div 
                  className="w-20 sm:w-28 h-[1px] mb-1 mx-auto" 
                  style={{ backgroundColor: '#78350f' }} 
                />
                <p className="text-[10px] sm:text-xs font-medium font-certificate-body" style={{ color: '#78350f' }}>Principal</p>
              </div>
            </div>

            {/* Certificate Serial Number */}
            <p 
              className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[8px] sm:text-[10px] tracking-widest opacity-50"
              style={{ color: '#78350f' }}
            >
              {serialNumber}
            </p>
          </div>
        </div>

        {/* Download Button - Premium Gold Theme */}
        <Button 
          onClick={handleDownload}
          className="gap-2 shadow-xl print:hidden px-8 py-6 text-base hover:scale-105 transition-all duration-300 rounded-full font-medium"
          style={{ 
            background: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)',
            color: '#fef3c7',
            boxShadow: '0 10px 30px -10px rgba(146, 64, 14, 0.5)'
          }}
        >
          <Download className="h-5 w-5" />
          Download Certificate
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function getCategoryColor(category: string): { bg: string; text: string } {
  const colors: Record<string, { bg: string; text: string }> = {
    "Sports House": { bg: 'rgba(239, 68, 68, 0.15)', text: '#b91c1c' },
    "Club": { bg: 'rgba(59, 130, 246, 0.15)', text: '#1d4ed8' },
    "Leadership": { bg: 'rgba(168, 85, 247, 0.15)', text: '#7c3aed' },
    "Events": { bg: 'rgba(34, 197, 94, 0.15)', text: '#15803d' },
    "Achievement": { bg: 'rgba(236, 72, 153, 0.15)', text: '#be185d' },
  };
  return colors[category] || { bg: 'rgba(251, 191, 36, 0.15)', text: '#92400e' };
}