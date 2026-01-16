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

export async function downloadBlobAsFile(
  blob: Blob,
  filename: string,
  _mimeType?: string
): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }

  const [{ Directory, Filesystem }, { Share }, { Browser }] = await Promise.all([
    import("@capacitor/filesystem"),
    import("@capacitor/share"),
    import("@capacitor/browser"),
  ]);

  const base64 = await blobToBase64(blob);
  const saved = await Filesystem.writeFile({
    path: filename,
    data: base64,
    directory: Directory.Documents,
  });

  const canShare = await Share.canShare();
  if (canShare.value) {
    await Share.share({
      title: filename,
      url: saved.uri,
    });
    return;
  }

  await Browser.open({ url: saved.uri });
}
