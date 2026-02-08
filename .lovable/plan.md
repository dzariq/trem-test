
# Plan: Add CCA Activity Images with Fallback Icons

## Overview

Enhance the CCA activity cards to display activity-specific images (e.g., a photo for "Art Club"). When no custom image is uploaded, show a category-based fallback icon (e.g., a palette icon for Arts, a basketball for Sports).

---

## Current State

- The `cca_activities` table does **not** have an image column
- Both hooks (`useStudentCcaEnrollments`, `useEligibleCcaActivities`) and interfaces (`EnrolledCcaActivity`, `CcaActivity`) lack image fields
- CCA cards in `CalendarPage.tsx` display text-only content with badges
- No existing storage bucket for CCA images

---

## Implementation Plan

### Step 1: Database - Add Image Column

Add a new `image_url` column to the `cca_activities` table to store the Supabase Storage URL for each activity's image.

```sql
ALTER TABLE cca_activities
ADD COLUMN image_url TEXT DEFAULT NULL;

COMMENT ON COLUMN cca_activities.image_url IS 'URL to the activity cover image stored in Supabase Storage';
```

### Step 2: Database - Create Storage Bucket

Create a new public storage bucket for CCA activity images.

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('cca-activity-images', 'cca-activity-images', true);

-- Allow anyone to view images (public bucket)
CREATE POLICY "Public can view CCA images"
ON storage.objects FOR SELECT
USING (bucket_id = 'cca-activity-images');

-- Teachers can upload/manage images
CREATE POLICY "Teachers can upload CCA images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'cca-activity-images'
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role = 'teacher'
  )
);

CREATE POLICY "Teachers can update CCA images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'cca-activity-images'
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role = 'teacher'
  )
);

CREATE POLICY "Teachers can delete CCA images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'cca-activity-images'
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role = 'teacher'
  )
);
```

### Step 3: Update TypeScript Types

Regenerate or manually update `src/integrations/supabase/types.ts` to include the new `image_url` column:

```typescript
// In cca_activities table type
Row: {
  // ... existing fields
  image_url: string | null;  // NEW
}
```

### Step 4: Update Hook Interfaces

**File: `src/hooks/useStudentCcaEnrollments.ts`**

Add `imageUrl` to the `EnrolledCcaActivity` interface:

```typescript
export interface EnrolledCcaActivity {
  // ... existing fields
  imageUrl: string | null;  // NEW
}
```

Update the Supabase select query to include `image_url`:

```typescript
cca_activities(
  id, name, category, type_id,
  cca_activity_types(id, name),
  meeting_day, meeting_time, location,
  public_description, is_active,
  image_url  // NEW
)
```

Map it in the activity object:

```typescript
imageUrl: e.cca_activities?.image_url || null,
```

**File: `src/hooks/useEligibleCcaActivities.ts`**

Add `imageUrl` to the `CcaActivity` interface:

```typescript
export interface CcaActivity {
  // ... existing fields
  imageUrl: string | null;  // NEW
}
```

Update the Supabase select query and mapping similarly.

### Step 5: Create CCA Image Component

**New File: `src/components/cca/CcaActivityImage.tsx`**

Create a reusable component that displays the activity image or a fallback icon based on category/type:

```typescript
import { cn } from "@/lib/utils";
import { 
  Palette, Trophy, BookOpen, Music, 
  Dumbbell, Mountain, Sparkles, Users,
  LucideIcon
} from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface CcaActivityImageProps {
  imageUrl: string | null | undefined;
  activityName: string;
  category?: string | null;
  typeName?: string | null;
  variant?: "card" | "details";  // card = smaller, details = larger
  className?: string;
}

// Map category/type to icon
function getCategoryIcon(category: string | null | undefined): LucideIcon {
  const name = (category ?? "").toLowerCase();
  switch (name) {
    case "arts":
    case "art":
      return Palette;
    case "sports":
    case "outdoor":
    case "outdoor cca":
      return Dumbbell;
    case "indoor":
    case "indoor cca":
      return Mountain;
    case "music":
      return Music;
    case "academic":
      return BookOpen;
    case "competition":
      return Trophy;
    case "enrichment":
      return Sparkles;
    default:
      return Users;
  }
}

// Map category/type to background color for fallback
function getCategoryBgColor(category: string | null | undefined): string {
  const name = (category ?? "").toLowerCase();
  switch (name) {
    case "arts":
    case "art":
      return "bg-pink-100 dark:bg-pink-900/30";
    case "sports":
    case "outdoor":
    case "outdoor cca":
      return "bg-amber-100 dark:bg-amber-900/30";
    case "indoor":
    case "indoor cca":
      return "bg-sky-100 dark:bg-sky-900/30";
    case "music":
      return "bg-violet-100 dark:bg-violet-900/30";
    case "academic":
      return "bg-indigo-100 dark:bg-indigo-900/30";
    case "competition":
      return "bg-rose-100 dark:bg-rose-900/30";
    case "enrichment":
      return "bg-teal-100 dark:bg-teal-900/30";
    default:
      return "bg-muted";
  }
}

export function CcaActivityImage({
  imageUrl,
  activityName,
  category,
  typeName,
  variant = "card",
  className,
}: CcaActivityImageProps) {
  const Icon = getCategoryIcon(typeName || category);
  const bgColor = getCategoryBgColor(typeName || category);
  
  const sizeClasses = variant === "card" 
    ? "w-16 h-16 rounded-lg" 
    : "w-full h-32 rounded-xl";
  
  const iconSize = variant === "card" ? "h-8 w-8" : "h-12 w-12";

  if (imageUrl) {
    return (
      <div className={cn(sizeClasses, "overflow-hidden flex-shrink-0", className)}>
        <img
          src={imageUrl}
          alt={activityName}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Hide broken image and show fallback
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    );
  }

  // Fallback: Icon with category-colored background
  return (
    <div 
      className={cn(
        sizeClasses,
        bgColor,
        "flex items-center justify-center flex-shrink-0",
        className
      )}
    >
      <Icon className={cn(iconSize, "text-muted-foreground/60")} />
    </div>
  );
}
```

### Step 6: Update CCA Card Layouts

**File: `src/pages/CalendarPage.tsx`**

Update both "Enrolled CCA Activities" and "Available CCA Activities" cards to include the image component.

**For Enrolled CCA Cards (around line 660-720):**

```tsx
<CardContent className="p-4">
  <div className="flex gap-3">
    {/* NEW: Activity Image */}
    <CcaActivityImage
      imageUrl={activity.imageUrl}
      activityName={activity.name}
      category={activity.category}
      typeName={activity.typeName}
      variant="card"
    />
    
    {/* Existing content wrapped in flex-1 */}
    <div className="flex-1 min-w-0">
      {/* Title and badges */}
      <div className="flex items-start justify-between gap-3 mb-2">
        ...
      </div>
      {/* Description */}
      ...
      {/* Meeting details */}
      ...
    </div>
  </div>
</CardContent>
```

**For Available CCA Cards (around line 795-860):**

Apply the same pattern.

### Step 7: Update CcaDetailsSheet

**File: `src/components/cca/CcaDetailsSheet.tsx`**

Add a larger hero image at the top of the details sheet:

```tsx
// In sheetContent, add at the top:
<CcaActivityImage
  imageUrl={activity.imageUrl}
  activityName={activity.name}
  category={activity.category}
  typeName={activity.typeName}
  variant="details"
  className="mb-4"
/>
```

---

## Visual Design

### Card Layout (with image)
```
+--------------------------------------------------+
| [Image/Icon]  | Art Club          [Enrolled][Indoor] |
| 64x64 px      | Explore your creativity...           |
|               | Wednesday, 3:30 PM - 5:00 PM         |
|               | Art Room                             |
|               | [Teacher Adam] [Test 5]              |
+--------------------------------------------------+
```

### Fallback Icons by Category
| Category/Type | Icon | Background Color |
|--------------|------|------------------|
| Arts | Palette | Pink |
| Sports/Outdoor | Dumbbell | Amber |
| Indoor | Mountain | Sky |
| Music | Music | Violet |
| Academic | BookOpen | Indigo |
| Competition | Trophy | Rose |
| Enrichment | Sparkles | Teal |
| Default | Users | Muted Gray |

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/xxx_add_cca_image.sql` | Create | Add image_url column + storage bucket |
| `src/components/cca/CcaActivityImage.tsx` | Create | New image/fallback component |
| `src/integrations/supabase/types.ts` | Regenerate | Include image_url in types |
| `src/hooks/useStudentCcaEnrollments.ts` | Modify | Add imageUrl to interface and query |
| `src/hooks/useEligibleCcaActivities.ts` | Modify | Add imageUrl to interface and query |
| `src/pages/CalendarPage.tsx` | Modify | Add CcaActivityImage to both card types |
| `src/components/cca/CcaDetailsSheet.tsx` | Modify | Add hero image at top of sheet |

---

## Summary

1. Add `image_url` column to `cca_activities` table
2. Create `cca-activity-images` storage bucket with appropriate RLS policies
3. Create reusable `CcaActivityImage` component with category-based fallback icons
4. Update hooks to fetch and expose the image URL
5. Integrate the image component into both Enrolled and Available CCA cards
6. Add a larger hero image to the CcaDetailsSheet

This creates a visually engaging experience for students and parents browsing CCAs, with beautiful fallback icons when custom images haven't been uploaded yet.
