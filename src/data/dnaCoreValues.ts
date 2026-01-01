export interface DNASection {
  title: string;
  points: string[];
}

export interface DNAValue {
  key: string;
  title: string;
  points?: string[];
  sections?: DNASection[];
}

export interface DNAFramework {
  framework_name: string;
  type: string;
  values: DNAValue[];
}

export const dnaCoreValues: DNAFramework = {
  framework_name: "Collinz DNA",
  type: "core_values",
  values: [
    {
      key: "love_the_school",
      title: "Love The School",
      points: [
        "When the school gets better, your work life gets easier.",
        "A strong school reputation strengthens your reputation too.",
        "Loving the school means believing in the mission, not just doing the tasks.",
        "Speaking positively about the school lifts the whole team."
      ]
    },
    {
      key: "passion_to_teach",
      title: "Passion To Teach",
      points: [
        "Avoid Routine Fatigue",
        "Ignite Learning",
        "Foster Creativity & Innovation",
        "Pursue Continuous Improvement",
        "Build A Calling"
      ]
    },
    {
      key: "respect_and_communication",
      title: "Respect & Communication",
      sections: [
        {
          title: "Key behaviours",
          points: [
            "Tone Matters",
            "Listening first",
            "Feedback With Respect",
            "Clarify, Don't Assume"
          ]
        },
        {
          title: "Practices That Build Unity",
          points: [
            "No Gossip",
            "No Side-Taking",
            "No Blaming",
            "Settle Issues Privately",
            "Support In Public"
          ]
        }
      ]
    },
    {
      key: "unity_team_before_self",
      title: "Unity: Team Before Self",
      points: [
        "Teaching alone is tough — educators grow stronger when they don't carry classroom battles alone.",
        "Unity isn't about agreeing on everything, but understanding each other and putting aside differences for the bigger mission.",
        "When teachers align expectations and approaches, students experience stability, confidence and direction.",
        "A united staffroom reduces stress, increases problem-solving capacity, and turns challenges into shared victories.",
        "Prioritise each other over ego — everyone grows faster, teaches better, and enjoys the work more."
      ]
    },
    {
      key: "responsibility_and_reliability",
      title: "Responsibility & Reliability",
      points: [
        "Honour Commitments",
        "Be Dependable",
        "Submit On Time",
        "Own & Improve",
        "Take Initiative"
      ]
    },
    {
      key: "growth_mindset",
      title: "Growth Mindset",
      points: [
        "Continuous Learning",
        "Adapt & Improve",
        "Embrace Challenges",
        "Stay Fresh, Not Stagnant"
      ]
    },
    {
      key: "care_for_students",
      title: "Care For Students",
      points: [
        "Encourage, Don't Embarrass",
        "Understand Backgrounds",
        "Celebrate Progress",
        "Be Patient"
      ]
    },
    {
      key: "role_model_behaviour",
      title: "Role Model Behaviour",
      sections: [
        {
          title: "Why it matters",
          points: [
            "Students copy what they see, not what they hear; teachers set the emotional & behavioral tone; consistency builds trust.",
            "Students notice how you handle stress, resolve conflicts, and treat others; character teaches louder than voice."
          ]
        },
        {
          title: "Essential practices",
          points: [
            "Model Fairness & Patience",
            "Stay Composed Under Pressure",
            "Lead by Example",
            "Align Words with Actions"
          ]
        }
      ]
    },
    {
      key: "positive_energy",
      title: "Positive Energy",
      sections: [
        {
          title: "Outcomes",
          points: [
            "Student Engagement (increases when teachers bring positive energy)",
            "Classroom Behaviour (improves in positive, optimistic environments)",
            "Teacher Satisfaction (rises when positive outlook becomes habit)"
          ]
        },
        {
          title: "Daily Practices",
          points: [
            "Smile and greet warmly",
            "Use encouraging tones",
            "Avoid negative or sarcasm",
            "Bring enthusiasm into class"
          ]
        }
      ]
    },
    {
      key: "self_reflection_and_improvement",
      title: "Self-Reflection & Improvement",
      points: [
        "Pause & Reflect",
        "Reflect After Tough Moments",
        "Practice End-of-Day Review",
        "Reflect Before React"
      ]
    }
  ]
};

export const valueColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  love_the_school: { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" },
  passion_to_teach: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
  respect_and_communication: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  unity_team_before_self: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  responsibility_and_reliability: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  growth_mindset: { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-200", dot: "bg-teal-500" },
  care_for_students: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },
  role_model_behaviour: { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200", dot: "bg-indigo-500" },
  positive_energy: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200", dot: "bg-yellow-500" },
  self_reflection_and_improvement: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200", dot: "bg-slate-500" }
};
