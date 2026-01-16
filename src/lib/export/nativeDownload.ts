import { Capacitor } from "@capacitor/core";

export const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read blob"));
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result);
    };
    reader.readAsDataURL(blob);
  });

export type ExportResult = {
  success: boolean;
  savedToDevice: boolean;
  shared: boolean;
};

export async function saveAndShareBlob(
  blob: Blob,
  filename: string,
  _mimeType?: string
): Promise<ExportResult> {
  const isNative = Capacitor.isNativePlatform();
  console.log("[EXPORT_DEBUG]", {
    platform: isNative ? "native" : "web",
    filename,
    type: blob.type,
    size: blob.size,
  });

  try {
    if (!isNative) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.rel = "noopener";
      link.click();
      URL.revokeObjectURL(url);
      return { success: true, savedToDevice: false, shared: false };
    }

    const [{ Directory, Filesystem }, { Share }] = await Promise.all([
      import("@capacitor/filesystem"),
      import("@capacitor/share"),
    ]);

    const base64WithPrefix = await blobToBase64(blob);
    const base64 = base64WithPrefix.split(",")[1] ?? "";
    let shared = false;
    let savedToDevice = false;

    try {
      const saved = await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Cache,
      });
      await Share.share({
        title: filename,
        url: saved.uri,
      });
      shared = true;
    } catch (err) {
      console.error("[EXPORT_FAIL]", err, {
        filename,
        type: blob.type,
        size: blob.size,
        platform: Capacitor.getPlatform(),
        stage: "share",
      });
    }

    try {
      await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Documents,
      });
      savedToDevice = true;
    } catch (err) {
      console.error("[EXPORT_FAIL]", err, {
        filename,
        type: blob.type,
        size: blob.size,
        platform: Capacitor.getPlatform(),
        stage: "save",
      });
    }

    return {
      success: shared || savedToDevice,
      savedToDevice,
      shared,
    };
  } catch (err) {
    console.error("[EXPORT_FAIL]", err, {
      filename,
      type: blob.type,
      size: blob.size,
      platform: Capacitor.getPlatform(),
      stage: "fatal",
    });
    return { success: false, savedToDevice: false, shared: false };
  }
}
