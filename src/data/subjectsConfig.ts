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
      { name: "English", shortName: "English" },
      { name: "English (First Language)", shortName: "English 1L" },
      { name: "English (Second Language)", shortName: "English 2L" },
      { name: "English as a Second Language", shortName: "English 2L" },
      { name: "First Language English", shortName: "English 1L" }
    ]
  },
  {
    baseName: "Chinese",
    shortName: "Chinese",
    variants: [
      { name: "Chinese (Foreign Language)", shortName: "Chinese FL" },
      { name: "Chinese (Second Language)", shortName: "Chinese 2L" },
      { name: "Chinese (Beginner)", shortName: "Chinese B." },
      { name: "Chinese Language (Advanced)", shortName: "Chinese Adv" },
      { name: "Chinese Language (Intermediate)", shortName: "Chinese Int" },
      { name: "Chinese Language (Beginner)", shortName: "Chinese Beg" },
      { name: "Chinese as a Second Language", shortName: "Chinese 2L" },
      { name: "Foreign Language Mandarin Chinese", shortName: "Chinese FL" },
      { name: "Mandarin Chinese Beginner", shortName: "Chinese B." }
    ]
  },
  {
    baseName: "Malay",
    shortName: "Malay",
    variants: [
      { name: "Malay (First Language)", shortName: "Malay 1L" },
      { name: "Malay (Foreign Language)", shortName: "Malay FL" },
      { name: "First Language Malay", shortName: "Malay 1L" },
      { name: "Foreign Language Malay", shortName: "Malay FL" },
      { name: "Malay Language (KSSR)", shortName: "Malay KSSR" },
      { name: "Malay Language (KSSR-Advanced)", shortName: "Malay KSSR-A" },
      { name: "Malay Language (KSSR-Intermediate)", shortName: "Malay KSSR-I" }
    ]
  },
  {
    baseName: "Mathematics",
    shortName: "Math",
    variants: [
      { name: "Mathematics", shortName: "Math" },
      { name: "Additional Mathematics", shortName: "Add Math" },
      { name: "Mathematics (Extended)", shortName: "Math Ext" }
    ]
  },
  {
    baseName: "Science",
    shortName: "Science",
    variants: [
      { name: "Science", shortName: "Science" },
      { name: "Biology", shortName: "Biology" },
      { name: "Chemistry", shortName: "Chemistry" },
      { name: "Physics", shortName: "Physics" },
      { name: "Science (Biology, Chemistry & Physics)", shortName: "Sci (B,C,P)" }
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
      { name: "History", shortName: "History" },
      { name: "History & Geography", shortName: "Hist & Geo" }
    ]
  },
  {
    baseName: "Others",
    shortName: "Others",
    variants: [
      { name: "ICT", shortName: "ICT" },
      { name: "Information Communications & Technology (ICT)", shortName: "ICT" },
      { name: "Living Skills & Arts", shortName: "Living Skills" },
      { name: "Art", shortName: "Art" },
      { name: "Arts", shortName: "Arts" },
      { name: "Music", shortName: "Music" },
      { name: "Moral", shortName: "Moral" },
      { name: "Islamic Studies", shortName: "Islamic St." },
      { name: "Physical Education", shortName: "PE" },
      { name: "*Computer Science (To be offered)", shortName: "Comp Sci" }
    ]
  }
];

// All individual subjects (flat list)
export const allSubjects: string[] = [
  // English
  "English",
  "English (First Language)",
  "English (Second Language)",
  "English as a Second Language",
  "First Language English",
  // Malay
  "Malay (First Language)",
  "Malay (Foreign Language)",
  "First Language Malay",
  "Foreign Language Malay",
  "Malay Language (KSSR)",
  "Malay Language (KSSR-Advanced)",
  "Malay Language (KSSR-Intermediate)",
  // Chinese
  "Chinese (Foreign Language)",
  "Chinese (Second Language)",
  "Chinese (Beginner)",
  "Chinese Language (Advanced)",
  "Chinese Language (Intermediate)",
  "Chinese Language (Beginner)",
  "Chinese as a Second Language",
  "Foreign Language Mandarin Chinese",
  "Mandarin Chinese Beginner",
  // Sciences
  "Science",
  "Biology",
  "Chemistry",
  "Physics",
  "Science (Biology, Chemistry & Physics)",
  // Mathematics
  "Mathematics",
  "Additional Mathematics",
  "Mathematics (Extended)",
  // Humanities
  "Business Studies",
  "Accounting",
  "Economics",
  "Global Perspectives",
  "Geography",
  "History",
  "History & Geography",
  // Others
  "ICT",
  "Information Communications & Technology (ICT)",
  "Living Skills & Arts",
  "Art",
  "Arts",
  "Music",
  "Moral",
  "Islamic Studies",
  "Physical Education",
  "*Computer Science (To be offered)"
];

// Shortened names for display in tight spaces
export const subjectShortNames: Record<string, string> = {
  "English": "English",
  "English (First Language)": "English 1L",
  "English (Second Language)": "English 2L",
  "English as a Second Language": "English 2L",
  "First Language English": "English 1L",
  "Malay (First Language)": "Malay 1L",
  "Malay (Foreign Language)": "Malay FL",
  "First Language Malay": "Malay 1L",
  "Foreign Language Malay": "Malay FL",
  "Malay Language (KSSR)": "Malay KSSR",
  "Malay Language (KSSR-Advanced)": "Malay KSSR-A",
  "Malay Language (KSSR-Intermediate)": "Malay KSSR-I",
  "Chinese (Foreign Language)": "Chinese FL",
  "Chinese (Second Language)": "Chinese 2L",
  "Chinese (Beginner)": "Chinese B.",
  "Chinese Language (Advanced)": "Chinese Adv",
  "Chinese Language (Intermediate)": "Chinese Int",
  "Chinese Language (Beginner)": "Chinese Beg",
  "Chinese as a Second Language": "Chinese 2L",
  "Foreign Language Mandarin Chinese": "Chinese FL",
  "Mandarin Chinese Beginner": "Chinese B.",
  "Additional Mathematics": "Add Math",
  "Mathematics": "Math",
  "Mathematics (Extended)": "Math Ext",
  "Science (Biology, Chemistry & Physics)": "Sci (B,C,P)",
  "Living Skills & Arts": "Living Skills",
  "Global Perspectives": "Global Persp.",
  "Business Studies": "Biz Studies",
  "Islamic Studies": "Islamic St.",
  "Economics": "Econs",
  "Geography": "Geo",
  "Chemistry": "Chem",
  "History & Geography": "Hist & Geo",
  "Information Communications & Technology (ICT)": "ICT",
  "Arts": "Arts",
  "Physical Education": "PE",
  "*Computer Science (To be offered)": "Comp Sci"
};

// Super short codes for charts and compact displays (ALL CAPS, standardized)
export const subjectTinyCodes: Record<string, string> = {
  "English": "ENG",
  "English (First Language)": "ENG 1L",
  "English (Second Language)": "ENG 2L",
  "English as a Second Language": "ENG 2L",
  "First Language English": "ENG 1L",
  "Malay (First Language)": "MAL 1L",
  "Malay (Foreign Language)": "MAL FL",
  "First Language Malay": "MAL 1L",
  "Foreign Language Malay": "MAL FL",
  "Malay Language (KSSR)": "MAL K",
  "Malay Language (KSSR-Advanced)": "MAL KA",
  "Malay Language (KSSR-Intermediate)": "MAL KI",
  "Chinese (Foreign Language)": "CHI FL",
  "Chinese (Second Language)": "CHI 2L",
  "Chinese (Beginner)": "CHI B.",
  "Chinese Language (Advanced)": "CHI A",
  "Chinese Language (Intermediate)": "CHI I",
  "Chinese Language (Beginner)": "CHI B",
  "Chinese as a Second Language": "CHI 2L",
  "Foreign Language Mandarin Chinese": "CHI FL",
  "Mandarin Chinese Beginner": "CHI B.",
  "Science": "SCI",
  "Biology": "BIO",
  "Chemistry": "CHEM",
  "Physics": "PHY",
  "Science (Biology, Chemistry & Physics)": "SCI",
  "Mathematics": "MATH",
  "Additional Mathematics": "A. MATH",
  "Mathematics (Extended)": "MATH E",
  "Business Studies": "BIZ ST.",
  "Accounting": "ACC",
  "Economics": "ECON",
  "Global Perspectives": "G. PERSP",
  "Geography": "GEO",
  "History": "HIST",
  "History & Geography": "H&G",
  "ICT": "ICT",
  "Information Communications & Technology (ICT)": "ICT",
  "Living Skills & Arts": "LSA",
  "Art": "ART",
  "Arts": "ARTS",
  "Music": "MUSIC",
  "Moral": "MORAL",
  "Islamic Studies": "ISL. ST.",
  "Physical Education": "PE",
  "*Computer Science (To be offered)": "CS"
};

// Subject colors - unique color per subject for charts, legends, badges
export const subjectColors: Record<string, string> = {
  // Languages - Blues & Purples
  "English": "#3b82f6",
  "English (First Language)": "#3b82f6",
  "English (Second Language)": "#60a5fa",
  "English as a Second Language": "#60a5fa",
  "First Language English": "#3b82f6",
  "Malay (First Language)": "#8b5cf6",
  "Malay (Foreign Language)": "#a78bfa",
  "First Language Malay": "#8b5cf6",
  "Foreign Language Malay": "#a78bfa",
  "Malay Language (KSSR)": "#7c3aed",
  "Malay Language (KSSR-Advanced)": "#8b5cf6",
  "Malay Language (KSSR-Intermediate)": "#a78bfa",
  "Chinese (Foreign Language)": "#c084fc",
  "Chinese (Second Language)": "#d8b4fe",
  "Chinese (Beginner)": "#e9d5ff",
  "Chinese Language (Advanced)": "#c084fc",
  "Chinese Language (Intermediate)": "#d8b4fe",
  "Chinese Language (Beginner)": "#e9d5ff",
  "Chinese as a Second Language": "#d8b4fe",
  "Foreign Language Mandarin Chinese": "#c084fc",
  "Mandarin Chinese Beginner": "#e9d5ff",
  
  // Sciences - Greens & Teals
  "Science": "#22c55e",
  "Biology": "#10b981",
  "Chemistry": "#14b8a6",
  "Physics": "#06b6d4",
  "Science (Biology, Chemistry & Physics)": "#22c55e",
  
  // Mathematics - Oranges & Yellows
  "Mathematics": "#f59e0b",
  "Additional Mathematics": "#eab308",
  "Mathematics (Extended)": "#f59e0b",
  
  // Humanities
  "Business Studies": "#64748b",
  "Accounting": "#4ade80",
  "Economics": "#fbbf24",
  "Global Perspectives": "#0ea5e9",
  "Geography": "#84cc16",
  "History": "#f97316",
  "History & Geography": "#f97316",
  
  // Others
  "ICT": "#6366f1",
  "Information Communications & Technology (ICT)": "#6366f1",
  "Living Skills & Arts": "#ec4899",
  "Art": "#f472b6",
  "Arts": "#f472b6",
  "Music": "#a855f7",
  "Moral": "#2dd4bf",
  "Islamic Studies": "#fb923c",
  "Physical Education": "#ef4444",
  "*Computer Science (To be offered)": "#6366f1"
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
