import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { openExternal } from "@/lib/native/openExternal";

const BUCKET = "cca-session-attachments";
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
export const ACCEPTED_ATTACHMENT_MIME = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
] as const;

export interface ActivityAttachment {
  id: string;
  activityId: string;
  fileName: string;
  storagePath: string;
  fileType: string | null;
  fileSize: number | null;
  createdAt: string;
  /** Cached signed URL — short-lived (10 min). */
  signedUrl: string | null;
  isImage: boolean;
  isPdf: boolean;
}

function sanitizeName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(-80);
}

function isImageType(mime: string | null | undefined, name: string): boolean {
  if (mime?.startsWith("image/")) return true;
  return /\.(png|jpe?g|webp|gif)$/i.test(name);
}
function isPdfType(mime: string | null | undefined, name: string): boolean {
  if (mime === "application/pdf") return true;
  return /\.pdf$/i.test(name);
}

/**
 * Attachments stored in `cca_activity_attachments` for event-style CCAs.
 * Files live in the private `cca-session-attachments` bucket under
 * `activity/<activity_id>/<timestamp>-<sanitized-name>`.
 *
 * Opens via short-lived signed URLs (10 min). Deletes purge storage first
 * then the DB row to avoid orphan rows pointing at missing objects.
 */
export function useCcaActivityAttachments(activityId: string | null | undefined) {
  const [items, setItems] = useState<ActivityAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // url cache: storagePath -> { url, expiresAt }
  const urlCacheRef = useRef<Map<string, { url: string; expiresAt: number }>>(
    new Map(),
  );

  const signOne = useCallback(async (path: string): Promise<string | null> => {
    const cached = urlCacheRef.current.get(path);
    if (cached && cached.expiresAt > Date.now() + 30_000) {
      return cached.url;
    }
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 600);
    if (error || !data?.signedUrl) return null;
    urlCacheRef.current.set(path, {
      url: data.signedUrl,
      expiresAt: Date.now() + 8 * 60 * 1000,
    });
    return data.signedUrl;
  }, []);

  const fetchItems = useCallback(async () => {
    if (!activityId) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("cca_activity_attachments")
        .select("*")
        .eq("activity_id", activityId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const base: ActivityAttachment[] = (data || []).map((r: any) => ({
        id: r.id,
        activityId: r.activity_id,
        fileName: r.file_name,
        storagePath: r.storage_path,
        fileType: r.file_type ?? null,
        fileSize: r.file_size ?? null,
        createdAt: r.created_at,
        signedUrl: null,
        isImage: isImageType(r.file_type, r.file_name),
        isPdf: isPdfType(r.file_type, r.file_name),
      }));

      // Resolve signed URLs in parallel so image tiles can render.
      const signed = await Promise.all(
        base.map(async (it) => ({ ...it, signedUrl: await signOne(it.storagePath) })),
      );
      setItems(signed);
    } catch (e: any) {
      console.error("[useCcaActivityAttachments] fetch error:", e);
      toast({
        title: "Could not load attachments",
        description: e?.message || "Try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [activityId, signOne]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const uploadFiles = useCallback(
    async (files: FileList | File[]): Promise<boolean> => {
      if (!activityId) return false;
      const list = Array.from(files);
      if (list.length === 0) return false;

      // Validate
      const invalid = list.find(
        (f) =>
          !ACCEPTED_ATTACHMENT_MIME.includes(f.type as any) ||
          f.size > MAX_BYTES,
      );
      if (invalid) {
        toast({
          title: "File rejected",
          description: `"${invalid.name}" must be an image or PDF under 10 MB.`,
          variant: "destructive",
        });
        return false;
      }

      setUploading(true);
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const uid = userRes.user?.id ?? null;

        for (const file of list) {
          const path = `activity/${activityId}/${Date.now()}-${sanitizeName(file.name)}`;
          const { error: upErr } = await supabase.storage
            .from(BUCKET)
            .upload(path, file, {
              contentType: file.type || undefined,
              upsert: false,
            });
          if (upErr) throw upErr;

          const { error: insErr } = await supabase
            .from("cca_activity_attachments")
            .insert({
              activity_id: activityId,
              file_name: file.name,
              storage_path: path,
              file_type: file.type || null,
              file_size: file.size,
              uploaded_by: uid,
            });
          if (insErr) {
            // Roll back the blob to avoid orphan storage objects.
            await supabase.storage.from(BUCKET).remove([path]);
            throw insErr;
          }
        }
        await fetchItems();
        return true;
      } catch (e: any) {
        console.error("[useCcaActivityAttachments] upload error:", e);
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
    [activityId, fetchItems],
  );

  const deleteAttachment = useCallback(
    async (item: ActivityAttachment): Promise<boolean> => {
      try {
        // Storage first, then DB — per shared cascading-deletes rule.
        const { error: rmErr } = await supabase.storage
          .from(BUCKET)
          .remove([item.storagePath]);
        if (rmErr && !/not.?found/i.test(rmErr.message)) {
          throw rmErr;
        }
        const { error: delErr } = await supabase
          .from("cca_activity_attachments")
          .delete()
          .eq("id", item.id);
        if (delErr) throw delErr;
        urlCacheRef.current.delete(item.storagePath);
        await fetchItems();
        return true;
      } catch (e: any) {
        console.error("[useCcaActivityAttachments] delete error:", e);
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

  const openAttachment = useCallback(
    async (item: ActivityAttachment): Promise<void> => {
      const url = item.signedUrl ?? (await signOne(item.storagePath));
      if (!url) {
        toast({
          title: "Could not open file",
          description: "Please try again.",
          variant: "destructive",
        });
        return;
      }
      await openExternal(url);
    },
    [signOne],
  );

  return {
    items,
    loading,
    uploading,
    refetch: fetchItems,
    uploadFiles,
    deleteAttachment,
    openAttachment,
  };
}