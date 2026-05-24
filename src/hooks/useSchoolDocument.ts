import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/integrations/supabase/types";

type DocType = Database["public"]["Enums"]["school_document_type"];

export type SchoolDocumentResult = {
  id: string;
  title: string;
  description: string | null;
  filePath: string;
  mimeType: string | null;
  academicYear: number | null;
  classYearId: number | null;
  signedUrl: string;
};

type Args = {
  docType: DocType;
  campusCode?: string | null;
  /** For student_timetable: prefer rows matching this class_years.id, fall back to NULL. */
  classYearId?: number | null;
  enabled?: boolean;
};

/**
 * Fetch the latest active school document of the given type from the
 * `school_documents` table and return a signed URL for the file.
 *
 * Selection rules (per web-admin hand-off):
 *  - student_timetable: rows where class_year_id = <given>. If none,
 *    fall back to rows where class_year_id IS NULL. Pick the row with
 *    the largest academic_year (NULL treated as oldest).
 *  - Other types: filter by doc_type + is_active + campus_code (when
 *    provided). Pick the row with the largest academic_year.
 */
export function useSchoolDocument({
  docType,
  campusCode,
  classYearId,
  enabled = true,
}: Args) {
  return useQuery<SchoolDocumentResult | null>({
    queryKey: ["schoolDocument", docType, campusCode ?? null, classYearId ?? null],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      let query = supabase
        .from("school_documents")
        .select(
          "id, title, description, file_path, mime_type, academic_year, class_year_id, campus_code, doc_type, is_active"
        )
        .eq("doc_type", docType)
        .eq("is_active", true);

      if (campusCode) {
        // Match either rows scoped to this campus or global (NULL) rows.
        query = query.or(`campus_code.eq.${campusCode},campus_code.is.null`);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      const rows = data ?? [];
      if (rows.length === 0) return null;

      // For student_timetable: prefer class-scoped rows, fall back to NULL.
      let candidates = rows as any[];
      if (docType === "student_timetable") {
        const classScoped = rows.filter(
          (r: any) => classYearId != null && r.class_year_id === classYearId
        );
        const globalScoped = rows.filter((r: any) => r.class_year_id == null);
        candidates = classScoped.length > 0 ? classScoped : globalScoped;
      } else {
        // Other types: don't restrict by class_year_id.
        candidates = rows;
      }

      if (candidates.length === 0) return null;

      // Largest academic_year wins; treat NULL as oldest (-Infinity).
      candidates.sort(
        (a: any, b: any) =>
          (b.academic_year ?? -Infinity) - (a.academic_year ?? -Infinity)
      );
      const pick = candidates[0];

      const { data: signed, error: signErr } = await supabase.storage
        .from("school-documents")
        .createSignedUrl(pick.file_path, 60 * 60);
      if (signErr || !signed?.signedUrl) {
        throw new Error(signErr?.message ?? "Failed to sign document URL");
      }

      return {
        id: pick.id,
        title: pick.title,
        description: pick.description ?? null,
        filePath: pick.file_path,
        mimeType: pick.mime_type ?? null,
        academicYear: pick.academic_year ?? null,
        classYearId: pick.class_year_id ?? null,
        signedUrl: signed.signedUrl,
      };
    },
  });
}

/**
 * Resolve the `class_years.id` for a student given their `class` string
 * (e.g. "BO-Y1A"). Returns null if no match.
 */
export function useStudentClassYearId(className: string | null | undefined) {
  return useQuery<number | null>({
    queryKey: ["studentClassYearId", className ?? null],
    enabled: Boolean(className),
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      if (!className) return null;
      const { data, error } = await supabase
        .from("class_years")
        .select("id")
        .eq("class_name", className)
        .eq("active", true)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data?.id as number | undefined) ?? null;
    },
  });
}