import { useMemo } from "react";
import DOMPurify from "dompurify";
import { cn } from "@/lib/utils";

interface Props {
  html: string;
  coverUrl?: string | null;
  className?: string;
}

const ALLOWED_TAGS = [
  "p","br","strong","em","u","s","b","i",
  "ul","ol","li",
  "h1","h2","h3","h4",
  "blockquote","code","pre",
  "a","img","span","div",
];
const ALLOWED_ATTR = ["href","target","rel","src","alt","title","class","data-cover"];

let hookInstalled = false;
const ensureHook = () => {
  if (hookInstalled) return;
  hookInstalled = true;
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A") {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer");
    }
  });
};

const stripCoverImage = (html: string, coverUrl?: string | null): string => {
  if (typeof window === "undefined") return html;
  try {
    const doc = new DOMParser().parseFromString(`<div id="root">${html}</div>`, "text/html");
    const root = doc.getElementById("root");
    if (!root) return html;
    root.querySelectorAll("img").forEach((img) => {
      const isDataCover = img.getAttribute("data-cover") === "true";
      const matchesCover = coverUrl ? img.getAttribute("src") === coverUrl : false;
      if (isDataCover || matchesCover) img.remove();
    });
    return root.innerHTML;
  } catch {
    return html;
  }
};

export function AnnouncementHtmlContent({ html, coverUrl, className }: Props) {
  const safeHtml = useMemo(() => {
    ensureHook();
    const cleaned = stripCoverImage(html ?? "", coverUrl);
    return DOMPurify.sanitize(cleaned, { ALLOWED_TAGS, ALLOWED_ATTR });
  }, [html, coverUrl]);

  return (
    <div
      className={cn(
        "prose prose-sm max-w-none text-foreground",
        "prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground",
        "prose-a:text-primary prose-blockquote:text-muted-foreground prose-blockquote:border-primary/40",
        "prose-img:rounded-lg prose-img:my-3 prose-li:text-foreground/90",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
