import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { saveAndShareBlob, type ExportResult } from "@/lib/export/nativeDownload";

type SectionBasedPdfOptions = {
  element: HTMLElement;
  filename: string;
  sectionsPerPage?: number;
  scale?: number;
};

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MARGIN_MM = 8;

/**
 * Export a report to PDF by grouping `.pdf-section` elements into pages
 * (default 2 sections per page). Each page is rendered independently via
 * html2canvas so no section is ever split across pages.
 */
export async function exportSectionBasedPdf({
  element,
  filename,
  sectionsPerPage = 2,
  scale = 2,
}: SectionBasedPdfOptions): Promise<ExportResult> {
  const safeFilename = filename.toLowerCase().endsWith(".pdf")
    ? filename
    : `${filename}.pdf`;

  // Collect all pdf-section nodes in DOM order
  const sectionNodes = Array.from(
    element.querySelectorAll<HTMLElement>(".pdf-section")
  );

  // If no sections found, fall back to rendering the whole element as one page
  if (sectionNodes.length === 0) {
    sectionNodes.push(element);
  }

  // Group sections into page groups
  const pageGroups: HTMLElement[][] = [];
  for (let i = 0; i < sectionNodes.length; i += sectionsPerPage) {
    pageGroups.push(sectionNodes.slice(i, i + sectionsPerPage));
  }

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const contentWidth = A4_WIDTH_MM - MARGIN_MM * 2;

  for (let pageIdx = 0; pageIdx < pageGroups.length; pageIdx++) {
    const group = pageGroups[pageIdx];

    // Create offscreen container with A4 width
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-100000px";
    container.style.top = "0";
    container.style.width = `${A4_WIDTH_MM}mm`;
    container.style.padding = `${MARGIN_MM}mm`;
    container.style.boxSizing = "border-box";
    container.style.background = "#ffffff";
    container.style.pointerEvents = "none";
    container.style.zIndex = "-1";

    // Clone each section into the container
    for (const section of group) {
      const clone = section.cloneNode(true) as HTMLElement;
      clone.style.width = "100%";
      clone.style.overflow = "visible";
      clone.style.maxHeight = "none";
      clone.style.height = "auto";
      container.appendChild(clone);
    }

    document.body.appendChild(container);

    // Copy canvas elements (charts etc.)
    for (const section of group) {
      const origCanvases = Array.from(section.querySelectorAll("canvas"));
      const clonedCanvases = Array.from(container.querySelectorAll("canvas"));
      origCanvases.forEach((orig, idx) => {
        const target = clonedCanvases[idx];
        if (!target) return;
        target.width = orig.width;
        target.height = orig.height;
        const ctx = target.getContext("2d");
        if (ctx) ctx.drawImage(orig, 0, 0);
      });
    }

    // Wait for images to load
    const images = Array.from(container.querySelectorAll("img"));
    await Promise.all(
      images.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            })
      )
    );

    // Wait for render
    await new Promise<void>((r) =>
      requestAnimationFrame(() => requestAnimationFrame(() => r()))
    );

    // Capture
    let canvas: HTMLCanvasElement;
    try {
      canvas = await html2canvas(container, {
        scale,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        windowWidth: container.scrollWidth,
        windowHeight: container.scrollHeight,
      });
    } finally {
      container.remove();
    }

    // Add to PDF
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const imgWidthMm = contentWidth;
    const imgHeightMm = (canvas.height / canvas.width) * imgWidthMm;

    if (pageIdx > 0) {
      pdf.addPage();
    }

    // If the rendered content is taller than one A4 page, split it
    const maxContentHeight = A4_HEIGHT_MM - MARGIN_MM * 2;
    if (imgHeightMm <= maxContentHeight) {
      pdf.addImage(imgData, "JPEG", MARGIN_MM, MARGIN_MM, imgWidthMm, imgHeightMm);
    } else {
      // Split tall content across multiple pages
      const pxPerMm = canvas.width / imgWidthMm;
      const pageHeightPx = maxContentHeight * pxPerMm;
      let yOffsetPx = 0;
      let isFirst = true;

      while (yOffsetPx < canvas.height) {
        const sliceHeightPx = Math.min(pageHeightPx, canvas.height - yOffsetPx);
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeightPx;
        const ctx = sliceCanvas.getContext("2d");
        if (!ctx) break;

        ctx.drawImage(
          canvas,
          0, yOffsetPx, canvas.width, sliceHeightPx,
          0, 0, canvas.width, sliceHeightPx
        );

        const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.95);
        const sliceHeightMm = sliceHeightPx / pxPerMm;

        if (!isFirst) {
          pdf.addPage();
        }
        pdf.addImage(sliceData, "JPEG", MARGIN_MM, MARGIN_MM, imgWidthMm, sliceHeightMm);

        yOffsetPx += sliceHeightPx;
        isFirst = false;
      }
    }
  }

  const pdfBlob = pdf.output("blob");
  const result = await saveAndShareBlob(pdfBlob, safeFilename, "application/pdf");
  if (!result.success) {
    throw new Error("PDF export failed");
  }
  return result;
}
