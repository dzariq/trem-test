import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { sortYearLevels, sortClasses } from "@/lib/classSorting";

// Filter out null/empty values
const filterValidValues = (values: (string | null | undefined)[]): string[] => {
  return values
    .filter((v): v is string => v !== null && v !== undefined)
    .map(v => v.trim())
    .filter(v => v !== "");
};

export function useAcademicFilters(options: UseAcademicFiltersOptions = {}): UseAcademicFiltersReturn {
  const { allowedClasses } = options;
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
          const scopedData = Array.isArray(allowedClasses)
            ? data.filter((s) => s.class && allowedClasses.includes(s.class))
            : data;

          // Store all students
          const validStudents: Student[] = scopedData
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
            filterValidValues(scopedData.map(s => s.year_level))
          )];
          const sortedYearLevels = sortYearLevels(uniqueYearLevels);
          setYearLevels(sortedYearLevels);
          
          // Extract unique classes (filter out empty/null)
          const uniqueClasses = [...new Set(
            filterValidValues(scopedData.map(s => s.class))
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
        toast({
          title: "Academic data unavailable",
          description: "Unable to load classes and year levels.",
          variant: "destructive",
        });
      } finally {
        setLoadingYearLevels(false);
        setLoadingClasses(false);
      }
    };
    
    loadData();
  }, [allowedClasses?.join(",")]);
  
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

  useEffect(() => {
    if (selectedClass && !classes.includes(selectedClass)) {
      setSelectedClass(classes[0] ?? null);
    }
    if (!selectedClass && classes.length > 0) {
      setSelectedClass(classes[0]);
    }
  }, [classes, selectedClass]);
  
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
