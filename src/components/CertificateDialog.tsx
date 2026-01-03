import { useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
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
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    const printContent = certificateRef.current;
    if (!printContent || isDownloading) return;

    setIsDownloading(true);
    
    try {
      const canvas = await html2canvas(printContent, {
        scale: 4,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        imageTimeout: 0,
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: false,
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`Certificate-${studentName.replace(/\s+/g, '-')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const fullDate = `January 15, ${year}`;

  // Generate 16-point star path
  const starPoints = (() => {
    const cx = 50, cy = 50, outerR = 50, innerR = 35, points = 16;
    const step = Math.PI / points;
    const path = [];
    for (let i = 0; i < 2 * points; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = i * step - Math.PI / 2;
      path.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    return path.join(' ');
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-none w-auto p-4 sm:p-6 overflow-auto bg-background border-none flex flex-col items-center gap-4 max-h-[90vh]"
        hideClose
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-2 right-2 z-50 p-2 rounded-full bg-muted hover:bg-accent transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center justify-center w-full overflow-auto py-4">
          <div 
            ref={certificateRef}
            className="relative overflow-hidden flex-shrink-0"
            style={{
              width: '320px',
              height: '453px',
              background: 'linear-gradient(180deg, #1a3d2e 0%, #0f2318 100%)',
              boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.6)',
              border: '3px solid #d4a537',
              outline: '1px solid rgba(212, 165, 55, 0.3)',
              outlineOffset: '4px',
            }}
          >
            {/* Background Logo */}
            <img 
              src={schoolLogo} 
              alt="" 
              className="absolute -right-24 -bottom-24 w-[480px] h-[480px] object-contain pointer-events-none"
              style={{
                opacity: 0.10,
                maskImage: 'linear-gradient(135deg, transparent 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,1) 100%)',
                WebkitMaskImage: 'linear-gradient(135deg, transparent 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,1) 100%)',
              }}
            />

            {/* Top Chevrons */}
            <svg className="absolute top-0 left-0 right-0 w-full h-20" viewBox="0 0 400 120" preserveAspectRatio="none">
              <polygon points="0,0 400,0 400,60 200,120 0,60" fill="#2d5a47" opacity="0.3"/>
              <polygon points="0,0 400,0 400,45 200,90 0,45" fill="#24503e" opacity="0.5"/>
              <polygon points="0,0 400,0 400,35 200,70 0,35" fill="#1a4535" opacity="0.7"/>
            </svg>

            {/* Bottom Chevrons */}
            <svg className="absolute bottom-0 left-0 right-0 w-full h-16" viewBox="0 0 400 120" preserveAspectRatio="none">
              <polygon points="0,60 200,0 400,60 400,120 0,120" fill="#1a4535" opacity="0.7"/>
              <polygon points="0,75 200,30 400,75 400,120 0,120" fill="#24503e" opacity="0.5"/>
            </svg>

            {/* Certificate Content */}
            <div className="relative h-full flex flex-col items-center py-6 px-6 text-center z-10">
              
              {/* Header */}
              <div className="flex flex-col items-center gap-0.5">
                <h1 className="text-4xl font-bold tracking-wider font-certificate-title" style={{ color: '#d4a537', textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>
                  {year}
                </h1>
                <h2 className="text-2xl italic tracking-wide font-certificate-script mt-0.5" style={{ color: '#e8c967' }}>
                  Certificate
                </h2>
                <p className="text-xs uppercase tracking-[0.3em] font-medium" style={{ color: '#d4a537' }}>
                  of Achievement
                </p>
              </div>

              {/* Ribbon with Seal */}
              <div className="relative w-[140%] -mx-[20%] mt-3">
                <svg className="w-full h-12" viewBox="0 0 400 80" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="ribbonGold" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#e8c967"/>
                      <stop offset="50%" stopColor="#d4a537"/>
                      <stop offset="100%" stopColor="#c9942a"/>
                    </linearGradient>
                  </defs>
                  <polygon points="0,25 200,55 400,25 400,45 200,75 0,45" fill="url(#ribbonGold)"/>
                  <polygon points="0,45 200,75 400,45 400,50 200,80 0,50" fill="#a67c1a"/>
                  <polygon points="0,22 200,52 400,22 400,25 200,55 0,25" fill="#f0d878" opacity="0.6"/>
                </svg>
                
                {/* Star Seal */}
                <div className="absolute left-1/2 -translate-x-1/2 top-[-15%]" style={{ filter: 'drop-shadow(0 8px 20px rgba(212, 165, 55, 0.4))' }}>
                  <svg viewBox="0 0 100 100" className="w-24 h-24">
                    <defs>
                      <linearGradient id="sealGold" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f0d878"/>
                        <stop offset="50%" stopColor="#d4a537"/>
                        <stop offset="100%" stopColor="#c9942a"/>
                      </linearGradient>
                    </defs>
                    <polygon points={starPoints} fill="url(#sealGold)"/>
                    <circle cx="50" cy="50" r="26" fill="#1a3d2e" stroke="#d4a537" strokeWidth="2"/>
                    <circle cx="50" cy="50" r="20" fill="none" stroke="rgba(212, 165, 55, 0.5)" strokeWidth="1"/>
                  </svg>
                  <img src={schoolLogo} alt="" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 object-contain"/>
                </div>
              </div>

              <div className="h-14" />

              <p className="text-xs uppercase tracking-[0.2em] font-medium -mt-2" style={{ color: '#d4a537' }}>
                Proudly Presented To
              </p>

              {/* Main Content */}
              <div className="flex flex-col items-center gap-1.5 flex-1 justify-center">
                <h3 className="text-2xl font-certificate-script px-2" style={{ color: '#e8c967', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  {studentName}
                </h3>
                
                {/* Decorative line */}
                <div className="flex items-center gap-2">
                  <div className="w-12 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, #d4a537)' }} />
                  <svg viewBox="0 0 24 24" width="6" height="6" fill="#d4a537">
                    <polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9"/>
                  </svg>
                  <div className="w-12 h-[1px]" style={{ background: 'linear-gradient(to left, transparent, #d4a537)' }} />
                </div>

                <h4 className="text-xl font-bold font-certificate-title uppercase tracking-wide mt-1" style={{ color: '#e8c967', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  {role}
                </h4>
                
                <h5 className="text-lg font-semibold font-certificate-title" style={{ color: '#d4a537' }}>
                  {organization}
                </h5>
              </div>

              {/* Footer */}
              <div className="w-full flex flex-col items-center gap-2 mt-auto">
                <p className="text-xs font-certificate-body" style={{ color: 'rgba(212, 165, 55, 0.8)' }}>
                  {fullDate}
                </p>
                
                <div className="w-full flex items-end justify-between px-4">
                  {['Principal', 'Director'].map((title) => (
                    <div key={title} className="text-center flex-1">
                      <div className="w-16 h-[1px] mb-1.5 mx-auto" style={{ backgroundColor: 'rgba(212, 165, 55, 0.5)' }} />
                      <p className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(212, 165, 55, 0.7)' }}>
                        {title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleDownload}
          disabled={isDownloading}
          className="gap-2 shadow-xl print:hidden px-6 py-5 text-sm hover:scale-105 transition-all duration-300 rounded-full font-medium disabled:opacity-70"
          style={{ 
            background: 'linear-gradient(135deg, #1a3d2e 0%, #0f2318 100%)',
            color: '#e8c967',
            border: '1px solid #d4a537',
            boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)'
          }}
        >
          {isDownloading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download Certificate
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
