import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { saveAndShareBlob, type ExportResult } from "@/lib/export/nativeDownload";

type ExportElementToPdfOptions = {
  element: HTMLElement;
  filename: string;
  pageFormat?: "a4" | "letter";
  marginMm?: number;
  scale?: number;
  pdfContentScale?: number;
};

export async function exportElementToPdf({
  element,
  filename,
  pageFormat = "a4",
  marginMm = 8,
  scale = 2,
  pdfContentScale = 0.8,
}: ExportElementToPdfOptions): Promise<ExportResult> {
  const safeFilename = filename.toLowerCase().endsWith(".pdf")
    ? filename
    : `${filename}.pdf`;

  const exportToken = `pdf-export-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;

  const rect = element.getBoundingClientRect();
  const exportContainer = document.createElement("div");
  exportContainer.style.position = "fixed";
  exportContainer.style.left = "-100000px";
  exportContainer.style.top = "0";
  exportContainer.style.width = `${rect.width}px`;
  exportContainer.style.pointerEvents = "none";
  exportContainer.style.background = "#ffffff";
  exportContainer.style.zIndex = "-1";

  const clonedElement = element.cloneNode(true) as HTMLElement;
  clonedElement.style.width = "100%";
  clonedElement.style.height = "auto";
  clonedElement.style.maxHeight = "none";
  clonedElement.style.overflow = "visible";
  clonedElement.setAttribute("data-pdf-export", exportToken);
  exportContainer.appendChild(clonedElement);
  document.body.appendChild(exportContainer);

  const originalCanvases = Array.from(element.querySelectorAll("canvas"));
  const clonedCanvases = Array.from(clonedElement.querySelectorAll("canvas"));
  originalCanvases.forEach((canvasEl, index) => {
    const clonedCanvas = clonedCanvases[index];
    if (!clonedCanvas) return;
    clonedCanvas.width = canvasEl.width;
    clonedCanvas.height = canvasEl.height;
    const ctx = clonedCanvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(canvasEl, 0, 0);
    }
  });

  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignore font load issues; export should still proceed.
    }
  }

  const images = Array.from(clonedElement.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            })
    )
  );

  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  );

  const cloneRect = clonedElement.getBoundingClientRect();
  const captureWidth = Math.max(
    clonedElement.scrollWidth,
    clonedElement.offsetWidth,
    cloneRect.width
  );
  const captureHeight = Math.max(
    clonedElement.scrollHeight,
    clonedElement.offsetHeight,
    cloneRect.height
  );

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(clonedElement, {
      scale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      windowWidth: captureWidth,
      windowHeight: captureHeight,
      scrollX: -window.scrollX,
      scrollY: -window.scrollY,
      onclone: (doc) => {
        const cloned = doc.querySelector(
          `[data-pdf-export="${exportToken}"]`
        ) as HTMLElement | null;
        if (!cloned) return;

        const unclipped = (node: HTMLElement) => {
          node.style.overflow = "visible";
          node.style.maxHeight = "none";
          node.style.height = "auto";
          node.style.contain = "none";
        };

        unclipped(cloned);
        let parent = cloned.parentElement;
        while (parent) {
          unclipped(parent);
          parent = parent.parentElement;
        }

        cloned
          .querySelectorAll(".sticky, [style*=\"position: sticky\"]")
          .forEach((node) => {
            (node as HTMLElement).style.position = "static";
          });

        cloned.querySelectorAll("*").forEach((node) => {
          const el = node as HTMLElement;
          el.style.overflow = "visible";
          el.style.maxHeight = "none";
        });
      },
    });
  } finally {
    exportContainer.remove();
  }

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: pageFormat,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - marginMm * 2;
  const contentHeight = pageHeight - marginMm * 2;

  const safeContentScale = Math.max(0.1, pdfContentScale);
  const drawWidthMm = contentWidth * safeContentScale;
  const drawX = marginMm + (contentWidth - drawWidthMm) / 2;
  const pxPerMm = canvas.width / drawWidthMm;
  const pageHeightPx = contentHeight * pxPerMm;
  let yOffsetPx = 0;
  let pageIndex = 0;

  while (yOffsetPx < canvas.height) {
    const sliceHeightPx = Math.min(pageHeightPx, canvas.height - yOffsetPx);
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeightPx;
    const ctx = pageCanvas.getContext("2d");
    if (!ctx) {
      break;
    }
    ctx.drawImage(
      canvas,
      0,
      yOffsetPx,
      canvas.width,
      sliceHeightPx,
      0,
      0,
      canvas.width,
      sliceHeightPx
    );
    const imgData = pageCanvas.toDataURL("image/jpeg", 1.0);
    const imgHeightMm = sliceHeightPx / pxPerMm;

    if (pageIndex > 0) {
      pdf.addPage();
    }
    pdf.addImage(imgData, "JPEG", drawX, marginMm, drawWidthMm, imgHeightMm);
    yOffsetPx += sliceHeightPx;
    pageIndex += 1;
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
