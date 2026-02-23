
# Rename and Reorganize Study Recommendations in Grade Entry

## What Changes

### 1. Rename "Comments for All Students" to "Study Recommendation"
The class-wide section (amber-themed card at the top) will be renamed from "Comments for All Students" to **"Study Recommendation"**, keeping the **"Class-wide"** pill badge.

### 2. Rename individual student section
The per-student section currently labeled "Special Remarks (this student only)" will be renamed to **"Study Recommendation"**, with the pill badge changed from "Optional" to **"Individual"**.

### 3. Reorder individual student fields
Currently the order inside each student card is:
1. Report Card Comments
2. Special Remarks (study recommendation)
3. Authentic Comments (Internal)

New order:
1. Report Card Comments
2. Authentic Comments (Internal)
3. Study Recommendation (Individual)

This places the individual study recommendation after the authentic comment, as requested.

### 4. Database verification
The backend already supports both recommendation types:
- **Class-wide**: stored in the `class_study_recommendations` table
- **Individual**: stored in the `student_grades.subject_comment` column

No database changes are needed -- both fields already exist.

## Technical Details

**File to modify:** `src/pages/teacher/TeacherAcademicPage.tsx`

- **Line ~1951**: Change label text from `"Comments for All Students"` to `"Study Recommendation"`
- **Lines ~2130-2173**: Rename "Special Remarks (this student only)" to "Study Recommendation", change badge from "Optional" to "Individual"
- **Lines ~2104-2191**: Reorder the three comment sections so Authentic Comments comes before the individual Study Recommendation
