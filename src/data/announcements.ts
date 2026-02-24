import { supabase } from "@/lib/supabase";
import { getMyProfile } from "@/data/profile";

export type AnnouncementId = number | string;

export type AnnouncementAttachment = {
  name: string;
  url: string;
};

export type Announcement = {
  id: AnnouncementId;
  title: string;
  snippet: string;
  content: string;
  date: string;
  category: string;
  image: string | null;
  attachments?: AnnouncementAttachment[];
  is_read?: boolean;
  requires_acknowledgement?: boolean;
  is_acknowledged?: boolean;
};

export type ListAnnouncementsParams = {
  limit?: number;
  studentId?: string | null;
};

const DEFAULT_LIMIT = 10;

const buildSnippet = (content: string, fallback = "") => {
  const base = content || fallback;
  return base.length > 140 ? `${base.slice(0, 140).trim()}...` : base;
};

const logSupabaseError = (label: string, error: any) => {
  console.error(`[announcements] ${label} error:`, {
    code: error?.code,
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
  });
};

export async function listAnnouncements(
  params: ListAnnouncementsParams = {}
): Promise<Announcement[]> {
  const profile = await getMyProfile();
  const limit = params.limit ?? DEFAULT_LIMIT;

  const execQuery = async (query: any, label: string) => {
    const result = await query;
    if (result.error) {
      logSupabaseError(label, result.error);
    }
    return result;
  };

  let baseQuery = supabase.from("announcements").select("*");

  const applyOrder = (query: any, column: "created_at" | "updated_at") =>
    query.order(column, { ascending: false }).limit(limit);

  const runWithFallbacks = async (column: "created_at" | "updated_at") => {
    let result = await execQuery(
      applyOrder(baseQuery, column),
      `listAnnouncements ${column}`
    );

    return result;
  };

  let { data: announcementRows, error: announcementError } = await runWithFallbacks("created_at");

  if (announcementError && announcementError.message?.toLowerCase().includes("created_at")) {
    ({ data: announcementRows, error: announcementError } = await runWithFallbacks("updated_at"));
  }

  if (announcementError) {
    throw new Error(announcementError.message);
  }

  if (!announcementRows || announcementRows.length === 0) {
    return [];
  }

  const announcementIds = announcementRows
    .map((row: any) => row.id)
    .filter((id: AnnouncementId) => id !== undefined && id !== null);

  if (announcementIds.length === 0) {
    return [];
  }

  // Fetch read status (with acknowledged) and attachments in parallel
  const [readResult, attachmentResult] = await Promise.all([
    supabase
      .from("announcement_reads")
      .select("announcement_id, acknowledged")
      .eq("user_id", profile.user_id)
      .in("announcement_id", announcementIds as any[]),
    supabase
      .from("announcement_attachments")
      .select("*")
      .in("announcement_id", announcementIds as any[]),
  ]);

  if (readResult.error) {
    throw new Error(readResult.error.message);
  }

  if (attachmentResult.error) {
    // Non-critical: log but don't block
    console.warn("[announcements] Failed to fetch attachments:", attachmentResult.error.message);
  }

  const readMap = new Map<AnnouncementId, { is_read: boolean; is_acknowledged: boolean }>();
  (readResult.data ?? []).forEach((row: any) => {
    readMap.set(row.announcement_id, {
      is_read: true,
      is_acknowledged: Boolean(row.acknowledged),
    });
  });

  // Group attachments by announcement_id
  const attachmentsByAnnouncementId = new Map<string, AnnouncementAttachment[]>();
  (attachmentResult.data ?? []).forEach((row: any) => {
    const aid = row.announcement_id;
    if (!attachmentsByAnnouncementId.has(aid)) {
      attachmentsByAnnouncementId.set(aid, []);
    }
    attachmentsByAnnouncementId.get(aid)!.push({
      name: row.name ?? row.file_name ?? "Attachment",
      url: row.url ?? row.file_url ?? "",
    });
  });

  return announcementRows.map((row: any) => {
    const readStatus = readMap.get(row.id);
    return {
      id: row.id,
      title: row.title ?? row.headline ?? "Announcement",
      content: row.content ?? row.body ?? row.message ?? "",
      snippet:
        row.snippet ??
        row.summary ??
        buildSnippet(row.content ?? row.body ?? row.message ?? ""),
      date: row.created_at ?? row.updated_at ?? row.date ?? new Date().toISOString(),
      category: row.category ?? row.type ?? row.audience ?? "General",
      image: row.image_url ?? row.image ?? row.banner_url ?? null,
      attachments: attachmentsByAnnouncementId.get(row.id) ?? [],
      is_read: readStatus?.is_read ?? false,
      requires_acknowledgement: Boolean(row.requires_acknowledgement),
      is_acknowledged: readStatus?.is_acknowledged ?? false,
    };
  });
}

export async function getAnnouncementById(
  announcementId: AnnouncementId
): Promise<Announcement | null> {
  const profile = await getMyProfile();
  let { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", announcementId)
    .maybeSingle();

  if (error) {
    logSupabaseError("getAnnouncementById", error);
  }

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const { data: readRow, error: readError } = await supabase
    .from("announcement_reads")
    .select("announcement_id, acknowledged")
    .eq("user_id", profile.user_id)
    .eq("announcement_id", announcementId)
    .maybeSingle();

  if (readError) {
    throw new Error(readError.message);
  }

  return {
    id: data.id,
    title: data.title ?? data.headline ?? "Announcement",
    content: data.content ?? data.body ?? data.message ?? "",
    snippet:
      data.snippet ??
      data.summary ??
      buildSnippet(data.content ?? data.body ?? data.message ?? ""),
    date: data.created_at ?? data.updated_at ?? data.date ?? new Date().toISOString(),
    category: data.category ?? data.type ?? data.audience ?? "General",
    image: data.image_url ?? data.image ?? data.banner_url ?? null,
    is_read: Boolean(readRow?.announcement_id),
    requires_acknowledgement: Boolean(data.requires_acknowledgement),
    is_acknowledged: Boolean(readRow?.acknowledged),
  };
}

export async function markAnnouncementRead(announcementId: AnnouncementId): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    throw new Error(userError.message);
  }
  if (!userData.user) {
    throw new Error("No authenticated user found.");
  }

  // Upsert but only set read_at if it's a new row (don't overwrite existing read_at)
  const { error } = await supabase
    .from("announcement_reads")
    .upsert(
      [{ announcement_id: announcementId, user_id: userData.user.id }],
      { onConflict: "announcement_id,user_id", ignoreDuplicates: true }
    );

  if (error) {
    throw new Error(error.message);
  }
}

export async function acknowledgeAnnouncement(announcementId: AnnouncementId): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    throw new Error(userError.message);
  }
  if (!userData.user) {
    throw new Error("No authenticated user found.");
  }

  // First ensure a read row exists
  await supabase
    .from("announcement_reads")
    .upsert(
      [{ announcement_id: announcementId, user_id: userData.user.id }],
      { onConflict: "announcement_id,user_id", ignoreDuplicates: true }
    );

  // Then set acknowledged = true, acknowledged_at = now() only if not already acknowledged
  const { error } = await supabase
    .from("announcement_reads")
    .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
    .eq("announcement_id", announcementId)
    .eq("user_id", userData.user.id)
    .eq("acknowledged", false);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getAnnouncementAttachments(
  announcementId: AnnouncementId
): Promise<AnnouncementAttachment[]> {
  const { data, error } = await supabase
    .from("announcement_attachments")
    .select("*")
    .eq("announcement_id", announcementId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row: any) => ({
    name: row.name ?? row.file_name ?? "Attachment",
    url: row.url ?? row.file_url ?? "",
  }));
}
