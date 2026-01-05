// Standardized category colors used across announcements and events
export const categoryColors: Record<string, { bg: string; text: string; border?: string }> = {
  all: { bg: "bg-primary", text: "text-primary-foreground" },
  academic: { bg: "bg-blue-500", text: "text-white" },
  sports: { bg: "bg-orange-500", text: "text-white" },
  arts: { bg: "bg-purple-500", text: "text-white" },
  meeting: { bg: "bg-teal-500", text: "text-white" },
  event: { bg: "bg-rose-500", text: "text-white" },
  general: { bg: "bg-slate-500", text: "text-white" },
  featured: { bg: "bg-primary", text: "text-primary-foreground" },
};

export const getCategoryColor = (category: string) => {
  const lowerCategory = category.toLowerCase();
  return categoryColors[lowerCategory] || { bg: "bg-muted", text: "text-muted-foreground" };
};
