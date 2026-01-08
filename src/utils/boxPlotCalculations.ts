/**
 * Box Plot Calculation Utilities
 * 
 * This module provides functions for calculating box plot statistics
 * using the Tukey method (1.5 * IQR for whiskers).
 */

import { AssessmentRecord } from "@/data/boxPlotMockData";

export interface OutlierInfo {
  score: number;
  label: string;  // subject name (Student mode) or student name (Subject mode)
}

export interface BoxPlotStats {
  year: string;
  n: number;           // sample size
  q1: number;          // 25th percentile
  median: number;      // 50th percentile
  q3: number;          // 75th percentile
  whiskerLow: number;  // lowest score >= (Q1 - 1.5*IQR)
  whiskerHigh: number; // highest score <= (Q3 + 1.5*IQR)
  outliers: number[];  // scores outside whiskers (for backward compatibility)
  outlierDetails: OutlierInfo[]; // detailed outlier info with labels
  mean: number;        // mean value
  iqr: number;         // Q3 - Q1
  min: number;         // minimum value
  max: number;         // maximum value
}

/**
 * Calculate percentile using linear interpolation (R-7 method)
 * 
 * The R-7 method is the default in many statistical packages including R.
 * Formula: h = (n-1)*p + 1, where p is the percentile (0-1)
 * 
 * @param sortedData - Pre-sorted array of numbers (ascending order)
 * @param p - Percentile as decimal (0-1), e.g., 0.25 for 25th percentile
 * @returns The interpolated percentile value
 */
export function percentile(sortedData: number[], p: number): number {
  if (sortedData.length === 0) return 0;
  if (sortedData.length === 1) return sortedData[0];
  
  const n = sortedData.length;
  
  // R-7 method: h = (n-1)*p + 1 (1-indexed), converted to 0-indexed
  const h = (n - 1) * p;
  const lowerIndex = Math.floor(h);
  const upperIndex = Math.ceil(h);
  
  if (lowerIndex === upperIndex) {
    return sortedData[lowerIndex];
  }
  
  // Linear interpolation between adjacent values
  const fraction = h - lowerIndex;
  return sortedData[lowerIndex] + fraction * (sortedData[upperIndex] - sortedData[lowerIndex]);
}

/**
 * Calculate complete boxplot statistics for a dataset
 * 
 * Uses Tukey method for whiskers:
 * - whiskerLow = lowest value >= Q1 - 1.5*IQR
 * - whiskerHigh = highest value <= Q3 + 1.5*IQR
 * - Outliers are values outside the whisker range
 * 
 * @param scores - Array of numeric scores
 * @param year - Academic year label
 * @returns Complete box plot statistics
 */
export function calculateBoxPlotStats(scores: number[], year: string, labels?: string[]): BoxPlotStats {
  if (scores.length === 0) {
    return {
      year,
      n: 0,
      q1: 0,
      median: 0,
      q3: 0,
      whiskerLow: 0,
      whiskerHigh: 0,
      outliers: [],
      outlierDetails: [],
      mean: 0,
      iqr: 0,
      min: 0,
      max: 0,
    };
  }

  // Create array of score-label pairs for tracking
  const scoreLabelPairs = scores.map((score, idx) => ({
    score,
    label: labels?.[idx] || `Item ${idx + 1}`
  }));

  // Sort scores in ascending order
  const sorted = [...scores].sort((a, b) => a - b);
  
  // Calculate quartiles using R-7 method
  const q1 = percentile(sorted, 0.25);
  const median = percentile(sorted, 0.5);
  const q3 = percentile(sorted, 0.75);
  const iqr = q3 - q1;
  
  // Calculate Tukey whisker bounds
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  // Find actual whisker values (must be actual data points within bounds)
  const whiskerLow = sorted.find(v => v >= lowerBound) ?? sorted[0];
  const whiskerHigh = [...sorted].reverse().find(v => v <= upperBound) ?? sorted[sorted.length - 1];
  
  // Identify outliers (values outside whisker range) with their labels
  const outlierDetails: OutlierInfo[] = scoreLabelPairs
    .filter(pair => pair.score < whiskerLow || pair.score > whiskerHigh)
    .map(pair => ({
      score: Math.round(pair.score),
      label: pair.label
    }));
  
  // Calculate mean
  const mean = Math.round(scores.reduce((sum, v) => sum + v, 0) / scores.length);
  
  return {
    year,
    n: scores.length,
    q1: Math.round(q1 * 10) / 10,
    median: Math.round(median * 10) / 10,
    q3: Math.round(q3 * 10) / 10,
    whiskerLow: Math.round(whiskerLow * 10) / 10,
    whiskerHigh: Math.round(whiskerHigh * 10) / 10,
    outliers: outlierDetails.map(o => o.score),
    outlierDetails,
    mean,
    iqr: Math.round(iqr * 10) / 10,
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

/**
 * Get years within a date range
 * 
 * @param records - Array of assessment records
 * @param startYear - Start year (inclusive)
 * @param endYear - End year (inclusive)
 * @returns Array of years within range (ascending order)
 */
export function getYearsInRange(records: AssessmentRecord[], startYear: string, endYear: string): string[] {
  const years = new Set<string>();
  records.forEach(r => years.add(r.academic_year));
  
  const start = parseInt(startYear);
  const end = parseInt(endYear);
  
  return Array.from(years)
    .filter(y => {
      const year = parseInt(y);
      return year >= start && year <= end;
    })
    .sort((a, b) => parseInt(a) - parseInt(b)); // Ascending
}

/**
 * Get all available years from records
 */
export function getAvailableYears(records: AssessmentRecord[]): string[] {
  const years = new Set<string>();
  records.forEach(r => years.add(r.academic_year));
  return Array.from(years).sort((a, b) => parseInt(a) - parseInt(b));
}

/**
 * Insight types for auto-generated analysis
 */
export interface Insight {
  type: "trend" | "consistency" | "outlier" | "sample";
  icon: "up" | "down" | "flat" | "warning" | "info";
  title: string;
  description: string;
}

/**
 * Generate insights from boxplot data
 * 
 * Analyzes trends across years to identify:
 * - Median trend (improving, declining, stable)
 * - Consistency trend (IQR tightening or widening)
 * - Outlier patterns
 * - Sample size warnings
 * 
 * @param stats - Array of box plot statistics by year
 * @returns Array of insights
 */
export function generateInsights(stats: BoxPlotStats[]): Insight[] {
  const insights: Insight[] = [];
  
  if (stats.length < 2) {
    insights.push({
      type: "sample",
      icon: "info",
      title: "Limited Data",
      description: "Need at least 2 years of data for trend analysis."
    });
    return insights;
  }
  
  // Sort by year ascending for trend analysis
  const sorted = [...stats].sort((a, b) => parseInt(a.year) - parseInt(b.year));
  
  // 1. Median trend analysis
  const firstMedian = sorted[0].median;
  const lastMedian = sorted[sorted.length - 1].median;
  const medianDelta = lastMedian - firstMedian;
  
  if (medianDelta > 5) {
    insights.push({
      type: "trend",
      icon: "up",
      title: "Median Trend: Improving",
      description: `+${Math.round(medianDelta)} points from ${sorted[0].year} to ${sorted[sorted.length - 1].year}`
    });
  } else if (medianDelta < -5) {
    insights.push({
      type: "trend",
      icon: "down",
      title: "Median Trend: Declining",
      description: `${Math.round(medianDelta)} points from ${sorted[0].year} to ${sorted[sorted.length - 1].year}`
    });
  } else {
    insights.push({
      type: "trend",
      icon: "flat",
      title: "Median Trend: Stable",
      description: `Relatively consistent across ${sorted.length} years`
    });
  }
  
  // 2. Consistency trend (IQR analysis)
  const firstIQR = sorted[0].iqr;
  const lastIQR = sorted[sorted.length - 1].iqr;
  const iqrDelta = lastIQR - firstIQR;
  
  if (iqrDelta < -3) {
    insights.push({
      type: "consistency",
      icon: "up",
      title: "Consistency: Improving",
      description: `IQR narrowed from ${firstIQR} to ${lastIQR} (less variance)`
    });
  } else if (iqrDelta > 3) {
    insights.push({
      type: "consistency",
      icon: "down",
      title: "Consistency: Widening",
      description: `IQR increased from ${firstIQR} to ${lastIQR} (more variance)`
    });
  }
  
  // 3. Outlier year identification
  const outlierCounts = sorted.map(s => ({ year: s.year, count: s.outliers.length }));
  const maxOutlierYear = outlierCounts.reduce((max, curr) => 
    curr.count > max.count ? curr : max, outlierCounts[0]);
  
  if (maxOutlierYear.count > 0) {
    insights.push({
      type: "outlier",
      icon: "warning",
      title: `Outlier Peak: ${maxOutlierYear.year}`,
      description: `${maxOutlierYear.count} outlier${maxOutlierYear.count > 1 ? 's' : ''} identified`
    });
  }
  
  // 4. Sample size warnings
  const lowSampleYears = sorted.filter(s => s.n > 0 && s.n < 5);
  if (lowSampleYears.length > 0) {
    insights.push({
      type: "sample",
      icon: "warning",
      title: "Low Sample Size",
      description: `Years with n < 5: ${lowSampleYears.map(s => s.year).join(", ")}`
    });
  }
  
  return insights;
}

/**
 * Filter records and calculate box plot stats for Student mode
 */
export function calculateStudentBoxPlotData(
  records: AssessmentRecord[],
  studentId: string,
  subjects?: string[],
  examType?: string,
  startYear: string = "2021",
  endYear: string = "2026"
): BoxPlotStats[] {
  // Filter by student
  let filtered = records.filter(r => r.student_id === studentId);
  
  // Optionally filter by subjects (multiple)
  if (subjects && subjects.length > 0) {
    filtered = filtered.filter(r => subjects.includes(r.subject));
  }
  
  // Optionally filter by exam type
  if (examType) {
    filtered = filtered.filter(r => r.exam_type === examType);
  }
  
  // Get years in range
  const years = getYearsInRange(filtered, startYear, endYear);
  
  // Calculate stats for each year with subject names as labels for outliers
  return years.map(year => {
    const yearRecords = filtered.filter(r => r.academic_year === year);
    const scores = yearRecords.map(r => r.score_numeric);
    const labels = yearRecords.map(r => r.subject); // Subject names for Student mode
    return calculateBoxPlotStats(scores, year, labels);
  }).sort((a, b) => parseInt(a.year) - parseInt(b.year)); // Ascending for display
}

/**
 * Filter records and calculate box plot stats for Subject (Cohort) mode
 * Enhanced to support multi-select classes and year groups
 */
export function calculateSubjectBoxPlotData(
  records: AssessmentRecord[],
  subjects: string[],
  cohortType: "classes" | "yearGroups" | "school",
  selectedClasses?: string[],
  selectedYearGroups?: string[],
  examType?: string,
  startYear: string = "2021",
  endYear: string = "2026"
): BoxPlotStats[] {
  // Filter by subjects (multiple)
  let filtered = subjects.length > 0 
    ? records.filter(r => subjects.includes(r.subject))
    : records;
  
  // Filter by cohort type with multi-select support
  if (cohortType === "classes" && selectedClasses && selectedClasses.length > 0) {
    filtered = filtered.filter(r => selectedClasses.includes(r.class_id));
  } else if (cohortType === "yearGroups" && selectedYearGroups && selectedYearGroups.length > 0) {
    filtered = filtered.filter(r => selectedYearGroups.includes(r.year_group));
  }
  // "school" = no additional filtering
  
  // Optionally filter by exam type
  if (examType) {
    filtered = filtered.filter(r => r.exam_type === examType);
  }
  
  // Get years in range
  const years = getYearsInRange(filtered, startYear, endYear);
  
  // Calculate stats for each year with student names as labels for outliers
  return years.map(year => {
    const yearRecords = filtered.filter(r => r.academic_year === year);
    const scores = yearRecords.map(r => r.score_numeric);
    const labels = yearRecords.map(r => r.student_name); // Student names for Subject mode
    return calculateBoxPlotStats(scores, year, labels);
  }).sort((a, b) => parseInt(a.year) - parseInt(b.year)); // Ascending for display
}
