

## Fix Subject Group Filter - Final 7 Groups

### Current State (8 groups)
English, Malay, Chinese, Mathematics, Science, Humanities, Social Studies, Others

### New State (7 groups, reordered)

| # | Group | Subjects |
|---|-------|----------|
| 1 | **English** | English (First Language), English (Second Language) |
| 2 | **Chinese** | Chinese (Foreign Language), Chinese (Second Language), Chinese (Beginner) |
| 3 | **Malay** | Malay (First Language), Malay (Foreign Language) |
| 4 | **Mathematics** | Mathematics, Additional Mathematics |
| 5 | **Science** | Science, Biology, Chemistry, Physics |
| 6 | **Humanities** | Business Studies, Accounting, Economics, Global Perspectives, Geography, History |
| 7 | **Others** | ICT, Living Skills & Arts, Art, Music, Moral, Islamic Studies |

### What changes
- **Reorder**: English -> Chinese -> Malay (previously English -> Malay -> Chinese)
- **Merge Social Studies into Humanities**: Geography, History, Global Perspectives move into the Humanities group
- **Remove** the standalone "Social Studies" group
- **Keep Mathematics** as its own group

### Technical detail
Single file change: `src/data/subjectsConfig.ts` -- update the `subjectGroups` array order and merge Social Studies variants into Humanities. All pages (AcademicPage, TeacherAcademicPage) automatically pick up the change since they import from this shared config.

