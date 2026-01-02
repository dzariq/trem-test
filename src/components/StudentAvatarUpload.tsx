import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Camera, Upload, Trash2, User } from "lucide-react";
import { toast } from "sonner";

interface StudentAvatarUploadProps {
  studentId: string;
  studentName: string;
  currentPhoto: string | null;
  onPhotoChange: (studentId: string, photoUrl: string | null) => void;
  size?: "sm" | "md" | "lg";
  editable?: boolean;
  colorClass?: string;
}

export function StudentAvatarUpload({
  studentId,
  studentName,
  currentPhoto,
  onPhotoChange,
  size = "md",
  editable = false,
  colorClass = "bg-gradient-to-br from-blue-400 to-blue-600",
}: StudentAvatarUploadProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-12 w-12",
    lg: "h-20 w-20",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-2xl",
  };

  const initials = studentName
    .split(" ")
    .map((n) => n[0])
    .join("");

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!previewUrl) return;

    setIsUploading(true);
    try {
      // Store in localStorage for persistence (in a real app, this would upload to storage)
      const storageKey = `student_photo_${studentId}`;
      localStorage.setItem(storageKey, previewUrl);
      
      onPhotoChange(studentId, previewUrl);
      toast.success("Photo updated successfully");
      setIsDialogOpen(false);
      setPreviewUrl(null);
    } catch (error) {
      toast.error("Failed to save photo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    const storageKey = `student_photo_${studentId}`;
    localStorage.removeItem(storageKey);
    onPhotoChange(studentId, null);
    setPreviewUrl(null);
    toast.success("Photo removed");
    setIsDialogOpen(false);
  };

  const handleOpenDialog = () => {
    if (editable) {
      setPreviewUrl(currentPhoto);
      setIsDialogOpen(true);
    }
  };

  return (
    <>
      <div
        className={`relative ${editable ? "cursor-pointer group" : ""}`}
        onClick={handleOpenDialog}
      >
        <Avatar className={`${sizeClasses[size]} border-2 border-background shadow-sm`}>
          {currentPhoto ? (
            <AvatarImage src={currentPhoto} alt={studentName} className="object-cover" />
          ) : null}
          <AvatarFallback className={`${colorClass} text-white ${textSizes[size]} font-semibold`}>
            {initials}
          </AvatarFallback>
        </Avatar>
        
        {editable && (
          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Student Photo</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-6 py-6">
            {/* Preview Avatar */}
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-primary/20">
                {previewUrl ? (
                  <AvatarImage src={previewUrl} alt={studentName} className="object-cover" />
                ) : null}
                <AvatarFallback className={`${colorClass} text-white text-4xl font-semibold`}>
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="text-center">
              <h3 className="font-semibold text-lg">{studentName}</h3>
              <p className="text-sm text-muted-foreground">Upload a photo for your child</p>
            </div>

            {/* Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                {previewUrl || currentPhoto ? "Change Photo" : "Upload Photo"}
              </Button>
              
              {(previewUrl || currentPhoto) && (
                <Button
                  variant="outline"
                  onClick={handleRemove}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Accepted formats: JPG, PNG, GIF. Max size: 5MB
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!previewUrl || isUploading}
            >
              {isUploading ? "Saving..." : "Save Photo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
