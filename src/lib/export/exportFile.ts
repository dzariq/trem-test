import { downloadBlob } from "@/lib/export/downloadFile";

export async function downloadBlobAsFile(
  blob: Blob,
  filename: string,
  _mimeType?: string
): Promise<boolean> {
  return downloadBlob(blob, filename, _mimeType);
}
