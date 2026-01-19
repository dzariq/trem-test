import type { LessonFlow, LessonFlowActivity, LessonFlowStep } from "@/data/lessonPlanData";
import { createDefaultLessonFlow } from "@/data/lessonPlanData";

const normalizeDuration = (value: unknown, fallback: number) => {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric;
  return fallback;
};

const normalizeActivity = (
  input: unknown,
  fallback: LessonFlowActivity
): LessonFlowActivity => {
  const activity = (input as Partial<LessonFlowActivity>) || {};
  const steps: LessonFlowStep[] = Array.isArray(activity.steps)
    ? activity.steps.map((step) => {
        if (typeof step === "string") {
          return {
            title: step,
            duration: 0,
            description: "",
          };
        }
        const stepValue = step as Partial<LessonFlowStep> & { durationMinutes?: unknown };
        return {
          title: typeof stepValue.title === "string" ? stepValue.title : "",
          duration: normalizeDuration(
            stepValue.duration ?? stepValue.durationMinutes,
            0
          ),
          description: typeof stepValue.description === "string" ? stepValue.description : "",
        };
      })
    : [];

  return {
    id: typeof activity.id === "string" ? activity.id : fallback.id,
    duration: normalizeDuration(
      activity.duration ?? (activity as { durationMinutes?: unknown }).durationMinutes,
      fallback.duration
    ),
    description: typeof activity.description === "string" ? activity.description : "",
    steps,
    isTeacherLed:
      typeof activity.isTeacherLed === "boolean" ? activity.isTeacherLed : fallback.isTeacherLed,
  };
};

export const normalizeLessonFlow = (input: unknown): LessonFlow => {
  const source = (input as { lessonFlow?: unknown })?.lessonFlow ?? input;
  const fallback = createDefaultLessonFlow();
  const flow = (source as Partial<LessonFlow>) || {};

  return {
    beginning: normalizeActivity(flow.beginning, fallback.beginning),
    middle: normalizeActivity(flow.middle, fallback.middle),
    end: normalizeActivity(flow.end, fallback.end),
  };
};
