
# Fix Inconsistent Subject Filter Groups

## Problem
When switching between students, the subject filter pills show different layouts because many database subject names don't match the names defined in `subjectsConfig.ts`. Unmatched subjects appear as standalone pills instead of being grouped, causing an inconsistent UI.

For example, the database has "First Language Malay" but the config expects "Malay (First Language)". The database has "Chinese as a Second Language" but the config expects "Chinese (Second Language)".

## Solution
Update `src/data/subjectsConfig.ts` to add all actual database subject names as variants in the appropriate groups. This ensures every subject falls into one of the 7 categories: **English, Chinese, Malay, Mathematics, Science, Humanities, Others**.

## Database Subjects to Map

| Group | Database Subject Names |
|-------|----------------------|
| English | English, English as a Second Language, First Language English |
| Chinese | Chinese Language (Advanced), Chinese Language (Intermediate), Chinese Language (Beginner), Chinese as a Second Language, Foreign Language Mandarin Chinese, Mandarin Chinese Beginner |
| Malay | First Language Malay, Foreign Language Malay, Malay Language (KSSR), Malay Language (KSSR-Advanced), Malay Language (KSSR-Intermediate) |
| Mathematics | Mathematics, Additional Mathematics, Mathematics (Extended) |
| Science | Science, Biology, Chemistry, Physics, Science (Biology, Chemistry & Physics) |
| Humanities | Business Studies, Accounting, Economics, Geography, History, History & Geography, Global Perspectives |
| Others | Information Communications & Technology (ICT), ICT, Islamic Studies, Moral, Music, Art, Arts, Living Skills & Arts, Physical Education, *Computer Science (To be offered) |

## Changes

### File: `src/data/subjectsConfig.ts`
- Add all missing database subject names as variants in the appropriate `subjectGroups` entries
- Add corresponding entries to `allSubjects`, `subjectShortNames`, `subjectTinyCodes`, and `subjectColors` for each new subject name
- This will make `groupedSubjectNames` include all DB subjects, so `analysisStandaloneSubjects` will be empty -- every subject will appear inside a group pill

### No other files need changes
The `AcademicPage.tsx` logic already correctly filters `subjectGroups` by assigned subjects and renders standalone subjects separately. Once all subjects are mapped into groups, the standalone list will naturally be empty and the layout will be consistent across all students.

## Technical Details

The key mechanism:
1. `groupedSubjectNames` is built from all variant names across all `subjectGroups`
2. `analysisSubjectGroups` filters groups to only show variants the student is assigned to
3. `analysisStandaloneSubjects` shows subjects NOT in any group -- this is what causes the inconsistency
4. By adding all DB subject names to the groups, standalone subjects disappear and every student sees the same grouped pill layout
