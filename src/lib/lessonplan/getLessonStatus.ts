import { normalizeLessonFlow } from "@/lib/lessonplan/normalizeLessonFlow";

export type LessonStatus = "draft" | "incomplete" | "complete";

export type LessonStatusInput = {
  approval?: Record<string, unknown> | null;
  reflection?: Record<string, unknown> | null;
  learningObjectives?: string[] | null;
  resources?: string | null;
  homework?: string | null;
  lessonFlow?: unknown;
};

const hasText = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0;

const hasLessonFlowSteps = (lessonFlow: unknown) => {
  const flow = normalizeLessonFlow(lessonFlow);
  const steps = [
    ...flow.beginning.steps,
    ...flow.middle.steps,
    ...flow.end.steps,
  ];
  return steps.length > 0;
};

export const getLessonStatus = (row: LessonStatusInput): LessonStatus => {
  const approval = row.approval ?? {};
  const approvalStatus = approval?.status;
  const approvedFlag = approval?.approved;

  if (approval?.completion === "complete") {
    return "complete";
  }

  if (approvalStatus === "complete" || approvedFlag === true) {
    return "complete";
  }

  if (hasText(row.reflection?.notes) || hasText(row.reflection?.text)) {
    return "complete";
  }

  const hasObjectives = (row.learningObjectives ?? []).length > 0;
  const hasResources = hasText(row.resources);
  const hasHomework = hasText(row.homework);
  const hasFlow = hasLessonFlowSteps(row.lessonFlow);

  if (hasObjectives || hasResources || hasHomework || hasFlow) {
    return "incomplete";
  }

  return "draft";
};
