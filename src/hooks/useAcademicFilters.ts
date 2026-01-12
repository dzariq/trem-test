import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface Student {
  id: string;
  name: string;
  class: string;
  year_level: string;
}

interface UseAcademicFiltersReturn {
  // Data
  yearLevels: string[];
  classes: string[];
  students: Student[];
  
  // Selection state
  selectedYearLevel: string | null;
  selectedClass: string | null;
  
  // Loading states
  loadingYearLevels: boolean;
  loadingClasses: boolean;
  loadingStudents: boolean;
  error: string | null;
  
  // Actions
  setSelectedYearLevel: (yearLevel: string | null) => void;
  setSelectedClass: (className: string | null) => void;
  
  // Computed
  getClassesForYearLevel: (yearLevel: string) => string[];
  getStudentsForClass: (className: string) => Student[];
}

// Sort year levels numerically (Y1, Y2, ... Y10, Y11)
const sortYearLevels = (levels: string[]): string[] => {
  return levels.sort((a, b) => {
    // Extract numeric part: "Y11" -> 11, "Year 5" -> 5
    const aMatch = a.match(/(\d+)/);
    const bMatch = b.match(/(\d+)/);
    const aNum = aMatch ? parseInt(aMatch[1]) : 0;
    const bNum = bMatch ? parseInt(bMatch[1]) : 0;
    return aNum - bNum;
  });
};

// Sort classes alphabetically (Y1A, Y1B, Y10A, etc)
const sortClasses = (classes: string[]): string[] => {
  return classes.sort((a, b) => {
    // Extract year and suffix: "Y11A" -> {year: 11, suffix: "A"}
    const aMatch = a.match(/^Y?(\d+)(.*)$/);
    const bMatch = b.match(/^Y?(\d+)(.*)$/);
    
    if (!aMatch || !bMatch) return a.localeCompare(b);
    
    const aYear = parseInt(aMatch[1]);
    const bYear = parseInt(bMatch[1]);
    
    if (aYear !== bYear) return aYear - bYear;
    return (aMatch[2] || "").localeCompare(bMatch[2] || "");
  });
};

// Filter out null/empty values
const filterValidValues = (values: (string | null | undefined)[]): string[] => {
  return values
    .filter((v): v is string => v !== null && v !== undefined)
    .map(v => v.trim())
    .filter(v => v !== "");
};

export function useAcademicFilters(): UseAcademicFiltersReturn {
  // Data state
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [yearLevels, setYearLevels] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  
  // Selection state
  const [selectedYearLevel, setSelectedYearLevel] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  
  // Loading states
  const [loadingYearLevels, setLoadingYearLevels] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load year levels and classes on mount
  useEffect(() => {
    const loadData = async () => {
      setLoadingYearLevels(true);
      setLoadingClasses(true);
      setError(null);
      
      try {
        // Fetch all distinct year_level and class values from students table
        const { data, error: fetchError } = await supabase
          .from("students")
          .select("id, name, year_level, class")
          .eq("archived", false);
        
        if (fetchError) throw fetchError;
        
        if (data) {
          // Store all students
          const validStudents: Student[] = data
            .filter(s => s.id && s.name && s.class)
            .map(s => ({
              id: s.id,
              name: s.name,
              class: s.class,
              year_level: s.year_level || ""
            }));
          setAllStudents(validStudents);
          
          // Extract unique year levels (filter out empty/null)
          const uniqueYearLevels = [...new Set(
            filterValidValues(data.map(s => s.year_level))
          )];
          const sortedYearLevels = sortYearLevels(uniqueYearLevels);
          setYearLevels(sortedYearLevels);
          
          // Extract unique classes (filter out empty/null)
          const uniqueClasses = [...new Set(
            filterValidValues(data.map(s => s.class))
          )];
          const sortedClasses = sortClasses(uniqueClasses);
          setClasses(sortedClasses);
          
          // Auto-select first year level and class
          if (sortedYearLevels.length > 0 && !selectedYearLevel) {
            setSelectedYearLevel(sortedYearLevels[0]);
          }
          if (sortedClasses.length > 0 && !selectedClass) {
            setSelectedClass(sortedClasses[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load academic filters:", err);
        setError("Failed to load academic data");
      } finally {
        setLoadingYearLevels(false);
        setLoadingClasses(false);
      }
    };
    
    loadData();
  }, []);
  
  // Get classes filtered by year level
  const getClassesForYearLevel = useCallback((yearLevel: string): string[] => {
    if (!yearLevel) return classes;
    
    const filtered = allStudents
      .filter(s => s.year_level === yearLevel)
      .map(s => s.class);
    
    const unique = [...new Set(filterValidValues(filtered))];
    return sortClasses(unique);
  }, [allStudents, classes]);
  
  // Filtered classes based on selected year level
  const filteredClasses = useMemo(() => {
    if (!selectedYearLevel) return classes;
    return getClassesForYearLevel(selectedYearLevel);
  }, [selectedYearLevel, classes, getClassesForYearLevel]);
  
  // Get students for a specific class
  const getStudentsForClass = useCallback((className: string): Student[] => {
    return allStudents
      .filter(s => s.class === className)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allStudents]);
  
  // Students filtered by selected class
  const students = useMemo(() => {
    if (!selectedClass) return [];
    return getStudentsForClass(selectedClass);
  }, [selectedClass, getStudentsForClass]);
  
  // When year level changes, reset class if not valid for new year level
  useEffect(() => {
    if (selectedYearLevel && selectedClass) {
      const validClasses = getClassesForYearLevel(selectedYearLevel);
      if (!validClasses.includes(selectedClass)) {
        // Select first valid class for this year level
        if (validClasses.length > 0) {
          setSelectedClass(validClasses[0]);
        } else {
          setSelectedClass(null);
        }
      }
    }
  }, [selectedYearLevel, selectedClass, getClassesForYearLevel]);

  return {
    // Data
    yearLevels,
    classes: filteredClasses,
    students,
    
    // Selection state
    selectedYearLevel,
    selectedClass,
    
    // Loading states
    loadingYearLevels,
    loadingClasses,
    loadingStudents,
    error,
    
    // Actions
    setSelectedYearLevel,
    setSelectedClass,
    
    // Computed
    getClassesForYearLevel,
    getStudentsForClass,
  };
}
