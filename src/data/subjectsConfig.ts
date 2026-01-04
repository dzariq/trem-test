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
    baseName: "Malay",
    shortName: "Malay",
    variants: [
      { name: "Malay (First Language)", shortName: "Malay 1L" },
      { name: "Malay (Foreign Language)", shortName: "Malay FL" }
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
      { name: "Economics", shortName: "Econs" }
    ]
  },
  {
    baseName: "Social Studies",
    shortName: "Social St.",
    variants: [
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

// Super short codes for charts and compact displays
export const subjectTinyCodes: Record<string, string> = {
  "English (First Language)": "Eng 1L",
  "English (Second Language)": "Eng 2L",
  "Malay (First Language)": "Mly 1L",
  "Malay (Foreign Language)": "Mly FL",
  "Chinese (Foreign Language)": "Chi FL",
  "Chinese (Second Language)": "Chi 2L",
  "Chinese (Beginner)": "Chi B",
  "Science": "Sci",
  "Biology": "Bio",
  "Chemistry": "Chem",
  "Physics": "Phys",
  "Mathematics": "Math",
  "Additional Mathematics": "A.Math",
  "Business Studies": "Biz",
  "Accounting": "Acct",
  "Economics": "Econ",
  "Global Perspectives": "GP",
  "Geography": "Geo",
  "History": "Hist",
  "ICT": "ICT",
  "Living Skills & Arts": "LSA",
  "Art": "Art",
  "Music": "Music",
  "Moral": "Moral",
  "Islamic Studies": "Islam"
};

// Helper function to get short name
export const getShortSubjectName = (name: string): string => {
  return subjectShortNames[name] || name;
};

// Helper function to get tiny 3-letter code
export const getTinySubjectCode = (name: string): string => {
  return subjectTinyCodes[name] || name.substring(0, 3).toUpperCase();
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
