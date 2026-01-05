// Week Configuration Data with Multi-Year Support

export interface WeekConfig {
  weekNumber: number;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
}

export interface AcademicYear {
  id: string;
  name: string; // e.g., "2025-2026"
  startYear: number;
  weeks: WeekConfig[];
}

// Generate 50 weeks starting from a base date
const generateWeekConfigs = (baseDate: Date): WeekConfig[] => {
  const weeks: WeekConfig[] = [];
  
  for (let i = 1; i <= 50; i++) {
    const startDate = new Date(baseDate);
    startDate.setDate(baseDate.getDate() + (i - 1) * 7);
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 4); // Friday of the same week
    
    weeks.push({
      weekNumber: i,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    });
  }
  
  return weeks;
};

// Initialize with default academic years
const initializeAcademicYears = (): AcademicYear[] => {
  return [
    {
      id: "2025-2026",
      name: "2025-2026",
      startYear: 2025,
      weeks: generateWeekConfigs(new Date("2025-01-06")), // First Monday of 2025
    },
    {
      id: "2026-2027",
      name: "2026-2027",
      startYear: 2026,
      weeks: generateWeekConfigs(new Date("2026-01-05")), // First Monday of 2026
    },
  ];
};

// Store for academic years
export let academicYears: AcademicYear[] = initializeAcademicYears();
export let activeYearId: string = "2026-2027";

// Get all academic years
export const getAcademicYears = (): AcademicYear[] => {
  return academicYears;
};

// Get active academic year
export const getActiveYear = (): AcademicYear | undefined => {
  return academicYears.find(y => y.id === activeYearId);
};

// Set active academic year
export const setActiveYear = (yearId: string): void => {
  if (academicYears.find(y => y.id === yearId)) {
    activeYearId = yearId;
  }
};

// Get week configs for active year (backward compatibility)
export const getWeekConfigs = (): WeekConfig[] => {
  const activeYear = getActiveYear();
  return activeYear?.weeks || [];
};

// Legacy export for backward compatibility
export const weekConfigs = getWeekConfigs();

// Create a new academic year
export const createAcademicYear = (name: string, startDate: Date, copyFromYearId?: string): AcademicYear => {
  const id = name;
  const startYear = startDate.getFullYear();
  
  let weeks: WeekConfig[];
  
  if (copyFromYearId) {
    const sourceYear = academicYears.find(y => y.id === copyFromYearId);
    if (sourceYear) {
      // Copy and offset dates by 1 year
      weeks = sourceYear.weeks.map(week => {
        const newStart = new Date(week.startDate);
        newStart.setFullYear(newStart.getFullYear() + 1);
        const newEnd = new Date(week.endDate);
        newEnd.setFullYear(newEnd.getFullYear() + 1);
        return {
          weekNumber: week.weekNumber,
          startDate: newStart.toISOString().split("T")[0],
          endDate: newEnd.toISOString().split("T")[0],
        };
      });
    } else {
      weeks = generateWeekConfigs(startDate);
    }
  } else {
    weeks = generateWeekConfigs(startDate);
  }
  
  const newYear: AcademicYear = {
    id,
    name,
    startYear,
    weeks,
  };
  
  academicYears.push(newYear);
  return newYear;
};

// Update week config for a specific year
export const updateYearWeekConfig = (yearId: string, weekNumber: number, startDate: string, endDate: string): void => {
  const yearIndex = academicYears.findIndex(y => y.id === yearId);
  if (yearIndex !== -1) {
    const weekIndex = academicYears[yearIndex].weeks.findIndex(w => w.weekNumber === weekNumber);
    if (weekIndex !== -1) {
      academicYears[yearIndex].weeks[weekIndex] = { weekNumber, startDate, endDate };
    }
  }
};

// Bulk update all weeks for a year
export const updateAllWeeksForYear = (yearId: string, weeks: WeekConfig[]): void => {
  const yearIndex = academicYears.findIndex(y => y.id === yearId);
  if (yearIndex !== -1) {
    academicYears[yearIndex].weeks = weeks;
  }
};

// Auto-fill weeks from Week 1 start date
export const autoFillWeeksFromStart = (yearId: string, week1StartDate: Date): void => {
  const yearIndex = academicYears.findIndex(y => y.id === yearId);
  if (yearIndex !== -1) {
    academicYears[yearIndex].weeks = generateWeekConfigs(week1StartDate);
  }
};

// Get week config by week number (for active year)
export const getWeekConfig = (weekNumber: number): WeekConfig | undefined => {
  const activeYear = getActiveYear();
  return activeYear?.weeks.find(w => w.weekNumber === weekNumber);
};

// Update week config (for active year - backward compatibility)
export const updateWeekConfig = (weekNumber: number, startDate: string, endDate: string): void => {
  updateYearWeekConfig(activeYearId, weekNumber, startDate, endDate);
};

// Get date for a specific lesson within a week
export const getLessonDate = (weekNumber: number, lessonNumber: number): string => {
  const weekConfig = getWeekConfig(weekNumber);
  if (!weekConfig) return "";
  
  const startDate = new Date(weekConfig.startDate);
  // Lesson 1 = Monday, Lesson 2 = Tuesday, etc.
  startDate.setDate(startDate.getDate() + (lessonNumber - 1));
  return startDate.toISOString().split("T")[0];
};

// Format date for display
export const formatWeekDateRange = (weekNumber: number): string => {
  const config = getWeekConfig(weekNumber);
  if (!config) return "";
  
  const start = new Date(config.startDate);
  const end = new Date(config.endDate);
  
  const formatOptions: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${start.toLocaleDateString("en-GB", formatOptions)} - ${end.toLocaleDateString("en-GB", formatOptions)}`;
};
