
# Plan: Display Study Recommendations in Parent Academic Report Card

## Overview

Enhance the expanded subject card in the Parent Academic page to display study recommendations in addition to the teacher's comment. The system supports two types of study recommendations:

1. **Class Study Recommendation** - A recommendation that applies to all students in the class (stored in `class_study_recommendations` table)
2. **Individual Study Recommendation** - A personalized recommendation specific to each student (stored as `subject_comment` in `student_grades` table)

When both are filled in, both should appear as separate sections.

---

## Current State Analysis

### Data Flow
- `useStudentReportCard` hook already fetches both:
  - `subject_comment` from `student_grades` (mapped to `subjectComment`) - Individual recommendation
  - `recommendation` from `class_study_recommendations` (mapped to `classStudyRecommendation`) - Class-wide recommendation

### UI Issue
- Currently only displays `teacherComment` in the expanded card
- Both study recommendation fields are fetched but not rendered

---

## Implementation Plan

### Step 1: Update SubjectGrade Interface Naming (Optional Clarity)
File: `src/hooks/useStudentReportCard.ts`

The current naming is slightly confusing:
- `subjectComment` is actually the individual study recommendation
- Consider renaming to `individualStudyRecommendation` for clarity (optional)

### Step 2: Update Expanded Subject Card UI
File: `src/pages/AcademicPage.tsx` (lines ~1675-1711)

Modify the expanded section to display:

```
+------------------------------------------+
| Teacher's Comment                        |
| [teacherComment text]                    |
+------------------------------------------+
| Study Tips                               |
|                                          |
| [Class Study Recommendation - if exists] |
| "For the class: [recommendation text]"   |
|                                          |
| [Individual Recommendation - if exists]  |
| "For [student name]: [recommendation]"   |
+------------------------------------------+
```

**Logic:**
1. If `classStudyRecommendation` exists and is not "-" or empty, show it with label "Class Recommendation"
2. If `subjectComment` (individual study recommendation) exists, show it with label "Personal Recommendation"
3. If only one exists, show just that one
4. If neither exists, show "No study tips available"

### Step 3: Visual Design

Use distinct styling for each recommendation type:
- **Class Recommendation**: Use a subtle amber/yellow background with a graduation cap or book icon
- **Individual Recommendation**: Use a subtle blue/teal background with a star or user icon
- Both should be visually distinct from the Teacher's Comment section

---

## Technical Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/AcademicPage.tsx` | Update expanded subject card section (around line 1676-1711) to render both study recommendations |

### Data Already Available
The grade object in the expanded section already contains:
- `expandedInRow.teacherComment` - Teacher's comment
- `expandedInRow.subjectComment` - Individual study recommendation
- `expandedInRow.classStudyRecommendation` - Class-wide recommendation

### Example Rendering Logic
```tsx
{/* Study Tips Section */}
{(hasClassRecommendation || hasIndividualRecommendation) && (
  <div className="mt-3 pt-3 border-t border-amber-200">
    <div className="flex items-center gap-2 mb-2">
      <Lightbulb className="h-4 w-4 text-amber-600" />
      <span className="text-sm font-semibold text-amber-700">Study Tips</span>
    </div>
    
    {/* Class Recommendation */}
    {hasClassRecommendation && (
      <div className="bg-amber-50 rounded-lg p-3 mb-2">
        <p className="text-xs font-medium text-amber-600 mb-1">For the Class</p>
        <p className="text-sm text-amber-900">{classStudyRecommendation}</p>
      </div>
    )}
    
    {/* Individual Recommendation */}
    {hasIndividualRecommendation && (
      <div className="bg-blue-50 rounded-lg p-3">
        <p className="text-xs font-medium text-blue-600 mb-1">For {studentName}</p>
        <p className="text-sm text-blue-900">{individualRecommendation}</p>
      </div>
    )}
  </div>
)}
```

---

## Summary of Changes

1. Add a new "Study Tips" section below the Teacher's Comment in the expanded subject card
2. Display class-wide recommendations when available (from `classStudyRecommendation`)
3. Display individual recommendations when available (from `subjectComment`)
4. Use distinct visual styling to differentiate between class-wide and personal recommendations
5. Handle all edge cases (neither, one, or both recommendations present)
