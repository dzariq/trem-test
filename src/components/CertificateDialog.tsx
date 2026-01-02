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
    // In a real app, this would generate a PDF
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-[95vw] w-[750px] p-0 overflow-visible bg-transparent border-none flex flex-col items-center gap-4"
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
          className="relative w-full aspect-[1.414/1] overflow-hidden print:p-8"
          style={{
            background: 'linear-gradient(145deg, #fefce8 0%, #fef3c7 40%, #fde68a 100%)',
            boxShadow: '0 25px 60px -12px rgba(120, 53, 15, 0.35), 0 0 0 1px rgba(217, 119, 6, 0.2)',
          }}
        >
          {/* Outer Gold Border */}
          <div 
            className="absolute inset-2 sm:inset-3 pointer-events-none"
            style={{ 
              border: '3px solid #92400e',
              background: 'transparent'
            }}
          />
          
          {/* Inner Gold Border with shadow */}
          <div 
            className="absolute inset-4 sm:inset-5 pointer-events-none"
            style={{ 
              border: '2px solid #b45309',
              boxShadow: 'inset 0 0 20px rgba(180, 83, 9, 0.1)'
            }}
          />

          {/* Decorative Corner Flourishes */}
          <div className="absolute top-5 left-5 w-8 h-8 sm:w-12 sm:h-12 border-t-[3px] border-l-[3px]" style={{ borderColor: '#78350f' }} />
          <div className="absolute top-5 right-5 w-8 h-8 sm:w-12 sm:h-12 border-t-[3px] border-r-[3px]" style={{ borderColor: '#78350f' }} />
          <div className="absolute bottom-5 left-5 w-8 h-8 sm:w-12 sm:h-12 border-b-[3px] border-l-[3px]" style={{ borderColor: '#78350f' }} />
          <div className="absolute bottom-5 right-5 w-8 h-8 sm:w-12 sm:h-12 border-b-[3px] border-r-[3px]" style={{ borderColor: '#78350f' }} />

          {/* Watermark Logo - Bottom Right, More Visible */}
          <div 
            className="absolute bottom-8 right-8 sm:bottom-12 sm:right-12 pointer-events-none opacity-[0.08]"
          >
            <img 
              src={schoolLogo} 
              alt="" 
              className="w-32 sm:w-44 h-auto"
            />
          </div>

          {/* Certificate Content */}
          <div className="relative h-full flex flex-col items-center justify-between py-6 sm:py-10 px-6 sm:px-12 text-center">
            {/* Header with Larger Logo */}
            <div className="flex flex-col items-center gap-1 sm:gap-2">
              <img 
                src={schoolLogo} 
                alt="School Logo" 
                className="h-16 w-auto sm:h-24 drop-shadow-lg"
              />
              <h1 
                className="text-xl sm:text-3xl font-bold uppercase tracking-[0.25em] mt-1"
                style={{ 
                  color: '#78350f',
                  textShadow: '0 1px 2px rgba(120, 53, 15, 0.1)'
                }}
              >
                Certificate of Achievement
              </h1>
              {/* Decorative line under title */}
              <div className="flex items-center gap-2 mt-1">
                <div className="w-12 sm:w-20 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, #b45309)' }} />
                <div className="w-2 h-2 rotate-45" style={{ backgroundColor: '#b45309' }} />
                <div className="w-12 sm:w-20 h-[1px]" style={{ background: 'linear-gradient(to left, transparent, #b45309)' }} />
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 flex flex-col items-center justify-center gap-2 sm:gap-3 max-w-lg -mt-2">
              <p 
                className="text-sm sm:text-lg"
                style={{ 
                  color: '#92400e',
                  fontFamily: 'Georgia, "Times New Roman", serif'
                }}
              >
                This is to certify that
              </p>
              
              <h2 
                className="text-2xl sm:text-4xl font-bold px-8 py-1 relative"
                style={{ 
                  color: '#78350f',
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontStyle: 'italic'
                }}
              >
                {studentName}
                {/* Underline decoration */}
                <div 
                  className="absolute bottom-0 left-4 right-4 h-[2px]"
                  style={{ background: 'linear-gradient(to right, transparent, #b45309, transparent)' }}
                />
              </h2>

              <p 
                className="text-sm sm:text-base mt-1"
                style={{ 
                  color: '#92400e',
                  fontFamily: 'Georgia, "Times New Roman", serif'
                }}
              >
                has been recognized for outstanding contribution as
              </p>

              <div className="space-y-0.5 mt-1">
                <h3 
                  className="text-xl sm:text-3xl font-bold"
                  style={{ color: '#b45309' }}
                >
                  {role}
                </h3>
                <p 
                  className="text-base sm:text-xl font-semibold" 
                  style={{ 
                    color: '#78350f',
                    fontFamily: 'Georgia, "Times New Roman", serif'
                  }}
                >
                  {organization}
                </p>
              </div>

              {/* Category in Cursive Style */}
              <p 
                className="text-lg sm:text-2xl mt-2"
                style={{ 
                  color: getCategoryColor(category).text,
                  fontFamily: '"Brush Script MT", "Segoe Script", cursive',
                  fontStyle: 'italic',
                  textShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                ~ {category} ~
              </p>
            </div>

            {/* Footer with Signatures */}
            <div className="w-full flex items-end justify-between px-4 sm:px-12 mt-2">
              <div className="text-center">
                <div 
                  className="w-20 sm:w-28 h-[1px] mb-1 mx-auto" 
                  style={{ backgroundColor: '#78350f' }} 
                />
                <p className="text-xs sm:text-sm font-medium" style={{ color: '#78350f' }}>Date</p>
                <p 
                  className="text-xs sm:text-sm" 
                  style={{ 
                    color: '#92400e',
                    fontFamily: 'Georgia, serif'
                  }}
                >
                  {year}
                </p>
              </div>
              
              {/* Seal placeholder */}
              <div 
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center"
                style={{ 
                  background: 'linear-gradient(135deg, #fbbf24, #b45309)',
                  boxShadow: '0 2px 8px rgba(180, 83, 9, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.3)'
                }}
              >
                <div 
                  className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 flex items-center justify-center"
                  style={{ borderColor: 'rgba(254, 243, 199, 0.5)' }}
                >
                  <span 
                    className="text-[8px] sm:text-[10px] font-bold uppercase"
                    style={{ color: '#fef3c7' }}
                  >
                    Official
                  </span>
                </div>
              </div>
              
              <div className="text-center">
                <div 
                  className="w-20 sm:w-28 h-[1px] mb-1 mx-auto" 
                  style={{ backgroundColor: '#78350f' }} 
                />
                <p className="text-xs sm:text-sm font-medium" style={{ color: '#78350f' }}>Principal</p>
              </div>
            </div>
          </div>
        </div>

        {/* Download Button - Outside Certificate */}
        <Button 
          onClick={handleDownload}
          className="gap-2 shadow-xl print:hidden px-6 py-5 text-base hover:scale-105 transition-transform"
          style={{ 
            backgroundColor: '#92400e',
            color: '#fef3c7'
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
