import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

export type AttachmentKind = "image" | "pdf";

export interface SessionAttachment {
  id: string;
  sessionId: string;
  kind: AttachmentKind;
  storagePath: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
  /** Public URL to display/download. */
  url: string;
}

const BUCKET = "cca-session-attachments";

function publicUrl(path: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Fetch & manage image/PDF attachments for one CCA session. Files live in the
 * `cca-session-attachments` bucket organised as `<activityId>/<sessionId>/<filename>`,
 * with a row in `public.cca_session_attachments` per file. RLS gates writes to
 * CCA module editors or assigned teachers.
 */
export function useCcaSessionAttachments(
  activityId: string | null,
  sessionId: string | null,
) {
  const [items, setItems] = useState<SessionAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchItems = useCallback(async () => {
    if (!sessionId) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("cca_session_attachments")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const mapped: SessionAttachment[] = (data || []).map((r: any) => ({
        id: r.id,
        sessionId: r.session_id,
        kind: r.kind,
        storagePath: r.storage_path,
        fileName: r.file_name,
        mimeType: r.mime_type,
        sizeBytes: r.size_bytes,
        createdAt: r.created_at,
        url: publicUrl(r.storage_path),
      }));
      setItems(mapped);
    } catch (e: any) {
      console.error("[useCcaSessionAttachments] fetch error:", e);
      toast({
        title: "Could not load attachments",
        description: e?.message || "Try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const uploadFile = useCallback(
    async (file: File, kind: AttachmentKind): Promise<boolean> => {
      if (!activityId || !sessionId) return false;
      setUploading(true);
      try {
        const ext = (file.name.split(".").pop() || "").toLowerCase();
        const safeBase = file.name
          .replace(/\.[^.]+$/, "")
          .replace(/[^a-zA-Z0-9-_]+/g, "_")
          .slice(0, 60);
        const stamp = Date.now();
        const path = `${activityId}/${sessionId}/${stamp}_${safeBase}${ext ? "." + ext : ""}`;

        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, {
            contentType: file.type || undefined,
            upsert: false,
          });
        if (upErr) throw upErr;

        const { data: userRes } = await supabase.auth.getUser();
        const { error: insErr } = await supabase
          .from("cca_session_attachments")
          .insert({
            session_id: sessionId,
            kind,
            storage_path: path,
            file_name: file.name,
            mime_type: file.type || null,
            size_bytes: file.size,
            uploaded_by: userRes.user?.id ?? null,
          });
        if (insErr) {
          // Roll back the uploaded blob to avoid orphans
          await supabase.storage.from(BUCKET).remove([path]);
          throw insErr;
        }

        await fetchItems();
        return true;
      } catch (e: any) {
        console.error("[useCcaSessionAttachments] upload error:", e);
        toast({
          title: "Upload failed",
          description: e?.message || "Could not upload file.",
          variant: "destructive",
        });
        return false;
      } finally {
        setUploading(false);
      }
    },
    [activityId, sessionId, fetchItems],
  );

  const deleteAttachment = useCallback(
    async (attachment: SessionAttachment): Promise<boolean> => {
      try {
        const { error: delErr } = await supabase
          .from("cca_session_attachments")
          .delete()
          .eq("id", attachment.id);
        if (delErr) throw delErr;
        await supabase.storage.from(BUCKET).remove([attachment.storagePath]);
        await fetchItems();
        return true;
      } catch (e: any) {
        console.error("[useCcaSessionAttachments] delete error:", e);
        toast({
          title: "Could not delete attachment",
          description: e?.message || "Try again later.",
          variant: "destructive",
        });
        return false;
      }
    },
    [fetchItems],
  );

  const images = items.filter((i) => i.kind === "image");
  const pdfs = items.filter((i) => i.kind === "pdf");

  return {
    items,
    images,
    pdfs,
    loading,
    uploading,
    refetch: fetchItems,
    uploadFile,
    deleteAttachment,
  };
}
