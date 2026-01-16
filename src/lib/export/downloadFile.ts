import { Capacitor } from "@capacitor/core";

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read blob"));
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const base64 = result.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });

export async function downloadBlob(
  blob: Blob,
  filename: string,
  _mimeType?: string
): Promise<boolean> {
  try {
    if (!Capacitor.isNativePlatform()) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.rel = "noopener";
      link.click();
      URL.revokeObjectURL(url);
      return true;
    }

    const [{ Directory, Filesystem }, { Share }] = await Promise.all([
      import("@capacitor/filesystem"),
      import("@capacitor/share"),
    ]);

    const base64 = await blobToBase64(blob);
    const saved = await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Documents,
    });

    const canShare = await Share.canShare();
    if (!canShare.value) {
      console.error("[downloadBlob] Share not available", {
        platform: Capacitor.getPlatform(),
        canShare,
      });
      return false;
    }

    await Share.share({
      title: filename,
      url: saved.uri,
    });

    return true;
  } catch (error) {
    if (Capacitor.isNativePlatform()) {
      let shareAvailable: boolean | undefined;
      try {
        const { Share } = await import("@capacitor/share");
        const canShare = await Share.canShare();
        shareAvailable = canShare.value;
      } catch (shareError) {
        console.error(
          "[downloadBlob] Failed to check share availability",
          shareError
        );
      }
      console.error("[downloadBlob] Export failed", {
        error,
        platform: Capacitor.getPlatform(),
        shareAvailable,
      });
    } else {
      console.error("[downloadBlob] Export failed", error);
    }
    return false;
  }
}
