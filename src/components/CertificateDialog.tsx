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
        className="max-w-[95vw] w-[700px] p-0 overflow-hidden bg-transparent border-none"
        hideClose
      >
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-2 right-2 z-50 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Certificate Container - Landscape */}
        <div 
          className="relative w-full aspect-[1.414/1] bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-4 sm:p-6 overflow-hidden print:p-8"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}
        >
          {/* Decorative Border */}
          <div 
            className="absolute inset-3 sm:inset-4 border-4 pointer-events-none"
            style={{ 
              borderColor: '#b45309',
              borderImage: 'linear-gradient(135deg, #fbbf24, #b45309, #fbbf24) 1'
            }}
          />
          
          {/* Inner Border */}
          <div 
            className="absolute inset-5 sm:inset-6 border-2 pointer-events-none"
            style={{ borderColor: '#d97706' }}
          />

          {/* Corner Decorations */}
          <div className="absolute top-6 left-6 w-12 h-12 sm:w-16 sm:h-16 border-t-4 border-l-4 rounded-tl-lg" style={{ borderColor: '#b45309' }} />
          <div className="absolute top-6 right-6 w-12 h-12 sm:w-16 sm:h-16 border-t-4 border-r-4 rounded-tr-lg" style={{ borderColor: '#b45309' }} />
          <div className="absolute bottom-6 left-6 w-12 h-12 sm:w-16 sm:h-16 border-b-4 border-l-4 rounded-bl-lg" style={{ borderColor: '#b45309' }} />
          <div className="absolute bottom-6 right-6 w-12 h-12 sm:w-16 sm:h-16 border-b-4 border-r-4 rounded-br-lg" style={{ borderColor: '#b45309' }} />

          {/* Certificate Content */}
          <div className="relative h-full flex flex-col items-center justify-between py-4 sm:py-8 px-4 sm:px-8 text-center">
            {/* Header with Logo */}
            <div className="flex flex-col items-center gap-2">
              <img 
                src={schoolLogo} 
                alt="School Logo" 
                className="h-12 w-auto sm:h-16 drop-shadow-md"
              />
              <h1 
                className="text-lg sm:text-2xl font-bold uppercase tracking-[0.2em]"
                style={{ color: '#78350f' }}
              >
                Certificate of Achievement
              </h1>
            </div>

            {/* Body */}
            <div className="flex-1 flex flex-col items-center justify-center gap-3 sm:gap-4 max-w-lg">
              <p className="text-sm sm:text-base text-amber-800">
                This is to certify that
              </p>
              
              <h2 
                className="text-xl sm:text-3xl font-bold px-6 py-2 border-b-2"
                style={{ 
                  color: '#78350f',
                  borderColor: '#d97706',
                  fontFamily: 'Georgia, serif'
                }}
              >
                {studentName}
              </h2>

              <p className="text-sm sm:text-base text-amber-800">
                has been recognized for outstanding contribution as
              </p>

              <div className="space-y-1">
                <h3 
                  className="text-lg sm:text-2xl font-semibold"
                  style={{ color: '#b45309' }}
                >
                  {role}
                </h3>
                <p className="text-base sm:text-lg font-medium" style={{ color: '#78350f' }}>
                  {organization}
                </p>
              </div>

              <div 
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold uppercase"
                style={{ 
                  backgroundColor: getCategoryColor(category).bg,
                  color: getCategoryColor(category).text
                }}
              >
                {category}
              </div>
            </div>

            {/* Footer */}
            <div className="w-full flex items-end justify-between px-2 sm:px-8">
              <div className="text-center">
                <div className="w-24 sm:w-32 border-t-2 mb-1" style={{ borderColor: '#78350f' }} />
                <p className="text-xs sm:text-sm" style={{ color: '#78350f' }}>Date</p>
                <p className="text-xs sm:text-sm font-medium" style={{ color: '#92400e' }}>{year}</p>
              </div>
              
              <div className="text-center">
                <div className="w-24 sm:w-32 border-t-2 mb-1" style={{ borderColor: '#78350f' }} />
                <p className="text-xs sm:text-sm" style={{ color: '#78350f' }}>Principal</p>
              </div>
            </div>
          </div>

          {/* Watermark */}
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]"
          >
            <img 
              src={schoolLogo} 
              alt="" 
              className="w-48 sm:w-72 h-auto"
            />
          </div>
        </div>

        {/* Download Button */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 print:hidden">
          <Button 
            onClick={handleDownload}
            className="gap-2 shadow-lg"
            style={{ backgroundColor: '#b45309' }}
          >
            <Download className="h-4 w-4" />
            Download Certificate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getCategoryColor(category: string): { bg: string; text: string } {
  const colors: Record<string, { bg: string; text: string }> = {
    "Sports House": { bg: 'rgba(239, 68, 68, 0.15)', text: '#dc2626' },
    "Club": { bg: 'rgba(59, 130, 246, 0.15)', text: '#2563eb' },
    "Leadership": { bg: 'rgba(168, 85, 247, 0.15)', text: '#9333ea' },
    "Events": { bg: 'rgba(34, 197, 94, 0.15)', text: '#16a34a' },
    "Achievement": { bg: 'rgba(236, 72, 153, 0.15)', text: '#db2777' },
  };
  return colors[category] || { bg: 'rgba(251, 191, 36, 0.15)', text: '#b45309' };
}
