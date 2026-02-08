import { useState, useRef } from "react";
import { Camera, X, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CcaActivityImage } from "./CcaActivityImage";
import { useCcaImageUpload } from "@/hooks/useCcaImageUpload";

interface CcaImageUploadProps {
  activityId: string;
  activityName: string;
  currentImageUrl: string | null | undefined;
  category?: string | null;
  typeName?: string | null;
  onUploadComplete?: (newUrl: string | null) => void;
  className?: string;
}

export function CcaImageUpload({
  activityId,
  activityName,
  currentImageUrl,
  category,
  typeName,
  onUploadComplete,
  className,
}: CcaImageUploadProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadImage, deleteImage, state } = useCcaImageUpload();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const newUrl = await uploadImage(activityId, selectedFile);
    if (newUrl) {
      onUploadComplete?.(newUrl);
      handleClose();
    }
  };

  const handleRemoveImage = async () => {
    if (!currentImageUrl) return;

    const success = await deleteImage(activityId, currentImageUrl);
    if (success) {
      onUploadComplete?.(null);
      handleClose();
    }
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      {/* Hero Image with Edit Overlay */}
      <div className={cn("relative group cursor-pointer", className)} onClick={() => setIsDialogOpen(true)}>
        <CcaActivityImage
          imageUrl={currentImageUrl}
          activityName={activityName}
          category={category}
          typeName={typeName}
          variant="details"
        />
        
        {/* Edit overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
          <div className="flex items-center gap-2 text-white font-medium">
            <Camera className="h-5 w-5" />
            <span>{currentImageUrl ? "Change Image" : "Add Image"}</span>
          </div>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Activity Image</DialogTitle>
            <DialogDescription>
              Upload an image for {activityName}. Recommended size: 800x400px.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preview Area */}
            <div className="relative w-full h-40 rounded-xl overflow-hidden bg-muted">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : currentImageUrl ? (
                <img
                  src={currentImageUrl}
                  alt={activityName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                  <Camera className="h-10 w-10 mb-2" />
                  <span className="text-sm">No image selected</span>
                </div>
              )}
            </div>

            {/* File Info */}
            {selectedFile && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setPreviewUrl(null);
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Upload Progress */}
            {state.isUploading && (
              <div className="space-y-2">
                <Progress value={state.progress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  {state.progress < 100 ? "Uploading..." : "Complete!"}
                </p>
              </div>
            )}

            {/* Error Message */}
            {state.error && (
              <p className="text-sm text-destructive text-center">{state.error}</p>
            )}

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Action Buttons */}
            <div className="flex gap-2">
              {!selectedFile ? (
                <>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={state.isUploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Select Image
                  </Button>
                  {currentImageUrl && (
                    <Button
                      variant="destructive"
                      onClick={handleRemoveImage}
                      disabled={state.isUploading}
                    >
                      {state.isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setPreviewUrl(null);
                      setSelectedFile(null);
                    }}
                    disabled={state.isUploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleUpload}
                    disabled={state.isUploading}
                  >
                    {state.isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
