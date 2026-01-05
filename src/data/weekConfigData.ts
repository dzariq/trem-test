// Week Configuration Data

export interface WeekConfig {
  weekNumber: number;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
}

// Generate 50 weeks starting from a base date
const generateWeekConfigs = (): WeekConfig[] => {
  const weeks: WeekConfig[] = [];
  const baseDate = new Date("2026-01-06"); // First Monday of 2026
  
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

// Mock week configurations (can be edited via the UI)
export let weekConfigs: WeekConfig[] = generateWeekConfigs();

// Get week config by week number
export const getWeekConfig = (weekNumber: number): WeekConfig | undefined => {
  return weekConfigs.find(w => w.weekNumber === weekNumber);
};

// Update week config
export const updateWeekConfig = (weekNumber: number, startDate: string, endDate: string): void => {
  const index = weekConfigs.findIndex(w => w.weekNumber === weekNumber);
  if (index !== -1) {
    weekConfigs[index] = { weekNumber, startDate, endDate };
  }
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
