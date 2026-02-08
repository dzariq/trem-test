import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

interface UseCcaImageUploadReturn {
  uploadImage: (activityId: string, file: File) => Promise<string | null>;
  deleteImage: (activityId: string, currentUrl: string) => Promise<boolean>;
  state: UploadState;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function useCcaImageUpload(): UseCcaImageUploadReturn {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  });

  const uploadImage = async (activityId: string, file: File): Promise<string | null> => {
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      const error = "Please upload a JPEG, PNG, or WebP image";
      setState({ isUploading: false, progress: 0, error });
      toast.error(error);
      return null;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      const error = "Image must be less than 5MB";
      setState({ isUploading: false, progress: 0, error });
      toast.error(error);
      return null;
    }

    setState({ isUploading: true, progress: 10, error: null });

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `${activityId}/${timestamp}_${sanitizedName}`;

      setState((prev) => ({ ...prev, progress: 30 }));

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("cca-activity-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      setState((prev) => ({ ...prev, progress: 60 }));

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("cca-activity-images")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      setState((prev) => ({ ...prev, progress: 80 }));

      // Update the cca_activities table with the new image URL
      const { error: updateError } = await supabase
        .from("cca_activities")
        .update({ image_url: publicUrl })
        .eq("id", activityId);

      if (updateError) {
        // Rollback: delete the uploaded file
        await supabase.storage.from("cca-activity-images").remove([filePath]);
        throw new Error(updateError.message);
      }

      setState({ isUploading: false, progress: 100, error: null });
      toast.success("Image uploaded successfully!");
      return publicUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to upload image";
      setState({ isUploading: false, progress: 0, error: errorMessage });
      toast.error(errorMessage);
      return null;
    }
  };

  const deleteImage = async (activityId: string, currentUrl: string): Promise<boolean> => {
    setState({ isUploading: true, progress: 20, error: null });

    try {
      // Extract file path from URL
      const urlParts = currentUrl.split("/cca-activity-images/");
      if (urlParts.length > 1) {
        const filePath = decodeURIComponent(urlParts[1]);
        
        // Delete from storage
        await supabase.storage.from("cca-activity-images").remove([filePath]);
      }

      setState((prev) => ({ ...prev, progress: 60 }));

      // Update the cca_activities table to remove the image URL
      const { error: updateError } = await supabase
        .from("cca_activities")
        .update({ image_url: null })
        .eq("id", activityId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setState({ isUploading: false, progress: 100, error: null });
      toast.success("Image removed successfully!");
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to remove image";
      setState({ isUploading: false, progress: 0, error: errorMessage });
      toast.error(errorMessage);
      return false;
    }
  };

  return { uploadImage, deleteImage, state };
}
