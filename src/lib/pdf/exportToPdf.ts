import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Capacitor } from "@capacitor/core";

type ExportElementToPdfOptions = {
  element: HTMLElement;
  filename: string;
  pageFormat?: "a4" | "letter";
  marginMm?: number;
  scale?: number;
  isCapacitor?: boolean;
};

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read PDF blob"));
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const base64 = result.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });

export async function exportElementToPdf({
  element,
  filename,
  pageFormat = "a4",
  marginMm = 8,
  scale = 2,
  isCapacitor,
}: ExportElementToPdfOptions): Promise<void> {
  const isNative =
    typeof isCapacitor === "boolean" ? isCapacitor : Capacitor.isNativePlatform();
  const safeFilename = filename.toLowerCase().endsWith(".pdf")
    ? filename
    : `${filename}.pdf`;

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
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

  if (!isNative) {
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = safeFilename;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }

  const [{ Directory, Filesystem }, { Share }, { Browser }] = await Promise.all([
    import("@capacitor/filesystem"),
    import("@capacitor/share"),
    import("@capacitor/browser"),
  ]);

  const base64 = await blobToBase64(pdfBlob);
  const saved = await Filesystem.writeFile({
    path: safeFilename,
    data: base64,
    directory: Directory.Documents,
  });

  const canShare = await Share.canShare();
  if (canShare.value) {
    await Share.share({
      title: safeFilename,
      url: saved.uri,
      text: "Report PDF",
    });
    return;
  }

  await Browser.open({ url: saved.uri });
}
