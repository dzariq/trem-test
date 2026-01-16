import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { saveAndShareBlob, type ExportResult } from "@/lib/export/nativeDownload";

type ExportElementToPdfOptions = {
  element: HTMLElement;
  filename: string;
  pageFormat?: "a4" | "letter";
  marginMm?: number;
  scale?: number;
};

export async function exportElementToPdf({
  element,
  filename,
  pageFormat = "a4",
  marginMm = 8,
  scale = 2,
}: ExportElementToPdfOptions): Promise<ExportResult> {
  const safeFilename = filename.toLowerCase().endsWith(".pdf")
    ? filename
    : `${filename}.pdf`;

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: false,
    backgroundColor: "#ffffff",
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: pageFormat,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - marginMm * 2;
  const contentHeight = pageHeight - marginMm * 2;

  const imgData = canvas.toDataURL("image/jpeg", 1.0);
  const imgHeight = (canvas.height * contentWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = marginMm;

  pdf.addImage(imgData, "JPEG", marginMm, position, contentWidth, imgHeight);
  heightLeft -= contentHeight;

  while (heightLeft > 0) {
    pdf.addPage();
    position = marginMm - (imgHeight - heightLeft);
    pdf.addImage(imgData, "JPEG", marginMm, position, contentWidth, imgHeight);
    heightLeft -= contentHeight;
  }

  const pdfBlob = pdf.output("blob");
  const result = await saveAndShareBlob(
    pdfBlob,
    safeFilename,
    "application/pdf"
  );
  if (!result.success) {
    throw new Error("PDF export failed");
  }
  return result;
}
