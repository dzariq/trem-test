// Master subject configuration - shared across the entire app
// This is the single source of truth for all subjects

export interface SubjectVariant {
  name: string;
  shortName: string;
}

export interface SubjectGroup {
  baseName: string;
  shortName: string;
  variants?: SubjectVariant[];
}

// Subject groups with variants (for dropdowns)
export const subjectGroups: SubjectGroup[] = [
  {
    baseName: "English",
    shortName: "English",
    variants: [
      { name: "English (First Language)", shortName: "English 1L" },
      { name: "English (Second Language)", shortName: "English 2L" }
    ]
  },
  {
    baseName: "Chinese",
    shortName: "Chinese",
    variants: [
      { name: "Chinese (Foreign Language)", shortName: "Chinese FL" },
      { name: "Chinese (Second Language)", shortName: "Chinese 2L" },
      { name: "Chinese (Beginner)", shortName: "Chinese B." }
    ]
  },
  {
    baseName: "Malay",
    shortName: "Malay",
    variants: [
      { name: "Malay (First Language)", shortName: "Malay 1L" },
      { name: "Malay (Foreign Language)", shortName: "Malay FL" }
    ]
  },
  {
    baseName: "Mathematics",
    shortName: "Math",
    variants: [
      { name: "Mathematics", shortName: "Math" },
      { name: "Additional Mathematics", shortName: "Add Math" }
    ]
  },
  {
    baseName: "Science",
    shortName: "Science",
    variants: [
      { name: "Science", shortName: "Science" },
      { name: "Biology", shortName: "Biology" },
      { name: "Chemistry", shortName: "Chemistry" },
      { name: "Physics", shortName: "Physics" }
    ]
  },
  {
    baseName: "Humanities",
    shortName: "Humanities",
    variants: [
      { name: "Business Studies", shortName: "Biz Studies" },
      { name: "Accounting", shortName: "Accounting" },
      { name: "Economics", shortName: "Econs" },
      { name: "Global Perspectives", shortName: "Global Persp" },
      { name: "Geography", shortName: "Geography" },
      { name: "History", shortName: "History" }
    ]
  },
  {
    baseName: "Others",
    shortName: "Others",
    variants: [
      { name: "ICT", shortName: "ICT" },
      { name: "Living Skills & Arts", shortName: "Living Skills" },
      { name: "Art", shortName: "Art" },
      { name: "Music", shortName: "Music" },
      { name: "Moral", shortName: "Moral" },
      { name: "Islamic Studies", shortName: "Islamic St." }
    ]
  }
];

// All individual subjects (flat list)
export const allSubjects: string[] = [
  // Languages
  "English (First Language)",
  "English (Second Language)",
  "Malay (First Language)",
  "Malay (Foreign Language)",
  "Chinese (Foreign Language)",
  "Chinese (Second Language)",
  "Chinese (Beginner)",
  // Sciences
  "Science",
  "Biology",
  "Chemistry",
  "Physics",
  // Mathematics
  "Mathematics",
  "Additional Mathematics",
  // Humanities (Business)
  "Business Studies",
  "Accounting",
  "Economics",
  // Social Studies
  "Global Perspectives",
  "Geography",
  "History",
  // Others
  "ICT",
  "Living Skills & Arts",
  "Art",
  "Music",
  "Moral",
  "Islamic Studies"
];

// Shortened names for display in tight spaces
export const subjectShortNames: Record<string, string> = {
  "English (First Language)": "English 1L",
  "English (Second Language)": "English 2L",
  "Malay (First Language)": "Malay 1L",
  "Malay (Foreign Language)": "Malay FL",
  "Chinese (Foreign Language)": "Chinese FL",
  "Chinese (Second Language)": "Chinese 2L",
  "Chinese (Beginner)": "Chinese B.",
  "Additional Mathematics": "Add Math",
  "Mathematics": "Math",
  "Living Skills & Arts": "Living Skills",
  "Global Perspectives": "Global Persp.",
  "Business Studies": "Biz Studies",
  "Islamic Studies": "Islamic St.",
  "Economics": "Econs",
  "Geography": "Geo",
  "Chemistry": "Chem"
};

// Super short codes for charts and compact displays (ALL CAPS, standardized)
export const subjectTinyCodes: Record<string, string> = {
  "English (First Language)": "ENG 1L",
  "English (Second Language)": "ENG 2L",
  "Malay (First Language)": "MAL 1L",
  "Malay (Foreign Language)": "MAL FL",
  "Chinese (Foreign Language)": "CHI FL",
  "Chinese (Second Language)": "CHI 2L",
  "Chinese (Beginner)": "CHI B.",
  "Science": "SCI",
  "Biology": "BIO",
  "Chemistry": "CHEM",
  "Physics": "PHY",
  "Mathematics": "MATH",
  "Additional Mathematics": "A. MATH",
  "Business Studies": "BIZ ST.",
  "Accounting": "ACC",
  "Economics": "ECON",
  "Global Perspectives": "G. PERSP",
  "Geography": "GEO",
  "History": "HIST",
  "ICT": "ICT",
  "Living Skills & Arts": "LSA",
  "Art": "ART",
  "Music": "MUSIC",
  "Moral": "MORAL",
  "Islamic Studies": "ISL. ST."
};

// Subject colors - unique color per subject for charts, legends, badges
// These are used globally across the app for consistency
export const subjectColors: Record<string, string> = {
  // Languages - Blues & Purples
  "English (First Language)": "#3b82f6",    // blue-500
  "English (Second Language)": "#60a5fa",   // blue-400
  "Malay (First Language)": "#8b5cf6",      // violet-500
  "Malay (Foreign Language)": "#a78bfa",    // violet-400
  "Chinese (Foreign Language)": "#c084fc",  // purple-400
  "Chinese (Second Language)": "#d8b4fe",   // purple-300
  "Chinese (Beginner)": "#e9d5ff",          // purple-200
  
  // Sciences - Greens & Teals
  "Science": "#22c55e",                     // green-500
  "Biology": "#10b981",                     // emerald-500
  "Chemistry": "#14b8a6",                   // teal-500
  "Physics": "#06b6d4",                     // cyan-500
  
  // Mathematics - Oranges & Yellows
  "Mathematics": "#f59e0b",                 // amber-500
  "Additional Mathematics": "#eab308",      // yellow-500
  
  // Humanities (Business) - Warm colors
  "Business Studies": "#64748b",            // slate-500
  "Accounting": "#4ade80",                  // green-400
  "Economics": "#fbbf24",                   // amber-400
  
  // Social Studies - Earth tones
  "Global Perspectives": "#0ea5e9",         // sky-500
  "Geography": "#84cc16",                   // lime-500
  "History": "#f97316",                     // orange-500
  
  // Others - Various
  "ICT": "#6366f1",                         // indigo-500
  "Living Skills & Arts": "#ec4899",        // pink-500
  "Art": "#f472b6",                         // pink-400
  "Music": "#a855f7",                       // purple-500
  "Moral": "#2dd4bf",                       // teal-400
  "Islamic Studies": "#fb923c"              // orange-400
};

// Helper function to get short name
export const getShortSubjectName = (name: string): string => {
  return subjectShortNames[name] || name;
};

// Helper function to get tiny 3-letter code
export const getTinySubjectCode = (name: string): string => {
  return subjectTinyCodes[name] || name.substring(0, 3).toUpperCase();
};

// Helper function to get subject color
export const getSubjectColor = (name: string): string => {
  return subjectColors[name] || "#6b7280"; // fallback to gray-500
};

// Get all variants for a base subject name
export const getSubjectVariants = (baseName: string): SubjectVariant[] | undefined => {
  const group = subjectGroups.find(g => g.baseName === baseName);
  return group?.variants;
};

// Check if a subject has variants
export const hasVariants = (baseName: string): boolean => {
  const group = subjectGroups.find(g => g.baseName === baseName);
  return !!group?.variants && group.variants.length > 1;
};
