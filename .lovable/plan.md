

# Plan: Add CCA Activity Image Upload Capability

## Problem Identified

After investigating the Supabase connection:

1. **The database connection is working correctly** - all queries succeed with 200 responses
2. **The `image_url` column exists** in `cca_activities` table (all values currently NULL)
3. **The storage bucket `cca-activity-images` exists** and is public (0 objects currently)
4. **RLS policies are correctly configured** for teacher image uploads

The actual issue is that there's **no UI to upload CCA activity images** - the schema is ready but the upload feature hasn't been built yet.

---

## Implementation Plan

### Step 1: Create Image Upload Component

Create a reusable `CcaImageUpload` component that:
- Displays the current image (or fallback icon)
- Shows an "Upload" button for PIC teachers
- Handles file selection and upload to Supabase Storage
- Updates the `image_url` in the `cca_activities` table

**New File: `src/components/cca/CcaImageUpload.tsx`**

Features:
- Accept image files (JPEG, PNG, WebP)
- Max file size: 5MB
- Compress/resize if needed
- Show upload progress
- Handle errors gracefully
- Preview before confirming

### Step 2: Add Image Upload to CCA Details Sheet (Teacher View)

Modify `CcaDetailsSheet.tsx` to:
- Show an "Edit Image" button when the user is a PIC teacher
- Allow clicking on the hero image to open the upload dialog
- Refresh the activity data after successful upload

### Step 3: Create Upload Handler Hook

**New File: `src/hooks/useCcaImageUpload.ts`**

This hook will handle:
- Uploading the file to `cca-activity-images` bucket
- Updating the `cca_activities.image_url` column
- Returning upload progress and error states

---

## Technical Details

### Storage Path Convention
```
cca-activity-images/{activity_id}/{timestamp}_{original_filename}
```

Example: `cca-activity-images/7908db09-dd1a-4122-bde5-d01f945eb034/1707350400_art-club-photo.jpg`

### Upload Flow

```text
1. Teacher clicks "Upload Image" button
2. File picker opens (accept: image/*)
3. User selects file
4. Preview shown with Confirm/Cancel buttons
5. On confirm:
   a. Upload to Storage: cca-activity-images/{activity_id}/...
   b. Get public URL
   c. UPDATE cca_activities SET image_url = {public_url}
   d. Refresh activity data
6. Show success toast
```

### Security

The existing RLS policies already allow:
- Teachers to INSERT/UPDATE/DELETE in `cca-activity-images` bucket
- Public SELECT (reading images)

No additional database changes needed.

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useCcaImageUpload.ts` | Create | Hook for handling image upload logic |
| `src/components/cca/CcaImageUpload.tsx` | Create | Upload button + preview component |
| `src/components/cca/CcaDetailsSheet.tsx` | Modify | Add image upload for PIC teachers |
| `src/pages/teacher/TeacherCalendarPage.tsx` | Modify | Pass refetch callback to sheets |

---

## UI Preview

### Before Upload (Fallback Icon)
```
+----------------------------------+
|                                  |
|        [Category Icon]           |
|        (Palette for Art)         |
|                                  |
|    [Click to upload image]       |
+----------------------------------+
```

### Upload Dialog
```
+----------------------------------+
|  Upload Activity Image           |
|                                  |
|  [Image Preview]                 |
|                                  |
|  art-club-photo.jpg (1.2MB)      |
|                                  |
|  [Cancel]        [Upload]        |
+----------------------------------+
```

### After Upload (Image Displayed)
```
+----------------------------------+
|                                  |
|     [Uploaded Image]             |
|                                  |
|    [Change Image] (PIC only)     |
+----------------------------------+
```

---

## Summary

1. Create `useCcaImageUpload` hook for handling file uploads to Supabase Storage
2. Create `CcaImageUpload` component with preview and upload functionality
3. Integrate upload capability into `CcaDetailsSheet` for PIC teachers
4. The existing database schema and storage bucket are ready - no migrations needed

