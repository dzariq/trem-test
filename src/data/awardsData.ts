import { GraduationCap, TrendingUp, Trophy, Sparkles, Heart, Crown, HandHeart, CalendarCheck, LucideIcon } from "lucide-react";

export interface AwardType {
  key: string;
  title: string;
  criteria: string[];
  icon: LucideIcon;
}

export interface AwardColors {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

export interface StudentAward {
  awardKey: string;
  studentId: string;
  term: string;
  date: string;
}

export const awardColors: Record<string, AwardColors> = {
  outstanding_academic_achievement_award: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  remarkable_growth_award: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  top_scorer_award: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200", dot: "bg-yellow-500" },
  rising_star_award: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },
  role_model_of_the_class_award: { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" },
  leadership_award: { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200", dot: "bg-indigo-500" },
  teachers_helper_excellence_award: { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-200", dot: "bg-teal-500" },
  best_attendance_award: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" }
};

export const awardTypes: AwardType[] = [
  {
    key: "outstanding_academic_achievement_award",
    title: "Outstanding Academic Achievement Award",
    criteria: [
      "Consistently achieves top grades across all subject.",
      "Demonstrates deep understanding of key concepts.",
      "Displays exceptional effort and dedication throughout the year."
    ],
    icon: GraduationCap
  },
  {
    key: "remarkable_growth_award",
    title: "Remarkable Growth Award",
    criteria: [
      "Shows significant improvement in academic performance across all subjects.",
      "Shows strong perseverance and commitment to learning.",
      "Actively seeks feedback and applies it to enhance understanding."
    ],
    icon: TrendingUp
  },
  {
    key: "top_scorer_award",
    title: "Top Scorer Award",
    criteria: [
      "Achieve the highest score in a subject.",
      "Demonstrate exceptional understanding and mastery of the subject matter.",
      "Display consistent effort and dedication to studies."
    ],
    icon: Trophy
  },
  {
    key: "rising_star_award",
    title: "Rising Star Award",
    criteria: [
      "Shows notable improvement in academic performance in a subject.",
      "Demonstrates strong self-motivation and commitment to progress.",
      "Participates actively and meaningfully during lessons."
    ],
    icon: Sparkles
  },
  {
    key: "role_model_of_the_class_award",
    title: "Role Model of the Class Award",
    criteria: [
      "Exemplifies outstanding behaviour and respect towards others.",
      "Demonstrates responsibility and dependability.",
      "Consistently sets a positive example and inspires peers.",
      "Displays exceptional diligence and work ethic."
    ],
    icon: Heart
  },
  {
    key: "leadership_award",
    title: "Leadership Award",
    criteria: [
      "Consistently take initiative and lead with confidence.",
      "Encourage teamwork and collaboration among peers.",
      "Demonstrate reliability and responsibility in leadership roles."
    ],
    icon: Crown
  },
  {
    key: "teachers_helper_excellence_award",
    title: "Teachers' Helper Excellence Award",
    criteria: [
      "Proactively offers help and support to teachers.",
      "Demonstrates high reliability in assisting with classroom tasks.",
      "Consistently supports both teachers and classmates.",
      "Maintains a positive, encouraging, and helpful attitude."
    ],
    icon: HandHeart
  },
  {
    key: "best_attendance_award",
    title: "Best Attendance Award",
    criteria: [
      "Maintains perfect attendance throughout the academic year.",
      "Always arrives punctually for class.",
      "Demonstrates strong commitment to consistent participation."
    ],
    icon: CalendarCheck
  }
];

// Mock data for student earned awards
export const studentAwards: StudentAward[] = [
  {
    awardKey: "outstanding_academic_achievement_award",
    studentId: "1",
    term: "Term 1 2025",
    date: "2025-03-15"
  },
  {
    awardKey: "best_attendance_award",
    studentId: "1",
    term: "Term 1 2025",
    date: "2025-03-15"
  },
  {
    awardKey: "rising_star_award",
    studentId: "2",
    term: "Term 1 2025",
    date: "2025-03-15"
  },
  {
    awardKey: "role_model_of_the_class_award",
    studentId: "2",
    term: "Term 2 2025",
    date: "2025-06-20"
  },
  {
    awardKey: "leadership_award",
    studentId: "1",
    term: "Term 2 2025",
    date: "2025-06-20"
  }
];

export const getAwardByKey = (key: string): AwardType | undefined => {
  return awardTypes.find(award => award.key === key);
};

export const getStudentAwards = (studentId: string): (StudentAward & { award: AwardType })[] => {
  return studentAwards
    .filter(sa => sa.studentId === studentId)
    .map(sa => {
      const award = getAwardByKey(sa.awardKey);
      return award ? { ...sa, award } : null;
    })
    .filter((sa): sa is StudentAward & { award: AwardType } => sa !== null);
};
