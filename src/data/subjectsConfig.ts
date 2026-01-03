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
      { name: "Chinese (Beginner)", shortName: "Chinese Beg" }
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
  // Technology
  "ICT",
  // Business & Commerce
  "Business Studies",
  "Accounting",
  "Economics",
  // Humanities
  "Global Perspectives",
  "History",
  "Geography",
  // Arts & Skills
  "Living Skills & Arts",
  "Music",
  // Values
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
  "Chinese (Beginner)": "Chinese Beg",
  "Additional Mathematics": "Add Math",
  "Mathematics": "Math",
  "Living Skills & Arts": "Living Skills",
  "Global Perspectives": "Global Persp",
  "Business Studies": "Business",
  "Islamic Studies": "Islamic St."
};

// Helper function to get short name
export const getShortSubjectName = (name: string): string => {
  return subjectShortNames[name] || name;
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
