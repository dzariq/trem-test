/**
 * Feature flags for parent-facing features.
 * These are controlled by environment variables.
 */
export const FEATURES = {
  gradeAnalysisParent:
    import.meta.env.VITE_FEATURE_GRADE_ANALYSIS_PARENT === 'true',
  homeworkParent:
    import.meta.env.VITE_FEATURE_HOMEWORK_PARENT === 'true',
  lessonPlanParent:
    import.meta.env.VITE_FEATURE_LESSON_PLAN_PARENT === 'true',
};
