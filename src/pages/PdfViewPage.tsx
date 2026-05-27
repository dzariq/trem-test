import { useEffect, useMemo, useState } from "react";

/**
 * Public PDF viewer route. Embeds the remote PDF in an iframe so the
 * browser's address bar shows our domain (e.g. collinz.app/pdf?...)
 * instead of the underlying Supabase storage URL.
 *
 * Usage: /pdf?url=<encoded pdf url>&title=<optional title>
 */
export default function PdfViewPage() {
  const params = useMemo(
    () => new URLSearchParams(window.location.search),
    [],
  );
  const pdfUrl = params.get("url") ?? "";
  const title = params.get("title") ?? "Document";
  const [valid, setValid] = useState(false);

  useEffect(() => {
    document.title = title;
    try {
      const u = new URL(pdfUrl);
      // Only allow http(s) targets to avoid javascript: / data: abuse
      setValid(u.protocol === "http:" || u.protocol === "https:");
    } catch {
      setValid(false);
    }
  }, [pdfUrl, title]);

  if (!pdfUrl || !valid) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-6 text-center">
        <h1 className="text-lg font-semibold text-foreground">
          No document specified
        </h1>
        <p className="text-sm text-muted-foreground">
          The link you followed is missing a valid PDF reference.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background">
      <iframe
        src={pdfUrl}
        title={title}
        className="h-full w-full border-0"
        allow="fullscreen"
      />
    </div>
  );
}