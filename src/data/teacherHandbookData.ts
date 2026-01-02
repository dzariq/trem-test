export interface HandbookSubpoint {
  text: string;
}

export interface HandbookMainPoint {
  point: string;
  subpoints: string[];
}

export interface HandbookSection {
  key: string;
  title: string;
  main_points: HandbookMainPoint[];
}

export interface HandbookData {
  document_title: string;
  purpose: string;
  sections: HandbookSection[];
}

export const teacherHandbookData: HandbookData = {
  document_title: "Collinz International School - Teacher's Handbook 2026 (Simplified)",
  purpose: "Main rules and responsibilities for teachers. Simple version for quick reference.",
  sections: [
    {
      key: "school_direction",
      title: "1) School Direction",
      main_points: [
        {
          point: "Vision",
          subpoints: [
            "Collinz builds 21st century skills and lifelong learning.",
            "Collinz works with parents and guardians to sow the seeds of excellence."
          ]
        },
        {
          point: "Mission",
          subpoints: [
            "Create a safe, stimulating, collaborative learning environment.",
            "Develop student character with dedicated educators.",
            "Use inquiry-based learning to support academic excellence."
          ]
        },
        {
          point: "Learner Skills Focus",
          subpoints: [
            "Nurture young minds.",
            "Cultivate inquiry.",
            "Broaden worldview.",
            "Practise a balanced lifestyle.",
            "Uphold values."
          ]
        },
        {
          point: "Core Values (FAMILY)",
          subpoints: [
            "Fulfilling social and emotional needs.",
            "Achieving excellence.",
            "Maximising potential.",
            "Integrating thinking skills.",
            "Learning to engage.",
            "Yearning to learn."
          ]
        }
      ]
    },
    {
      key: "teacher_conduct",
      title: "2) Teacher Code of Conduct",
      main_points: [
        {
          point: "Student welfare comes first",
          subpoints: [
            "Put students' well-being first in all decisions and actions.",
            "Be fair and consistent.",
            "Handle misconduct immediately while protecting dignity and confidentiality.",
            "Do not embarrass, shame, or humiliate students.",
            "Keep student information confidential unless required for work or by law.",
            "Do not use teacher-student relationships for personal gain."
          ]
        },
        {
          point: "Professional behaviour",
          subpoints: [
            "Be prepared for lessons.",
            "Communicate clearly and respectfully.",
            "Maintain good attendance and punctuality.",
            "Use professional language and emotional control.",
            "Dress appropriately and professionally.",
            "No abusive language or inappropriate remarks on campus."
          ]
        },
        {
          point: "Colleague and teamwork standards",
          subpoints: [
            "Respect colleagues' roles and opinions.",
            "Support junior teachers and trainees.",
            "Respect senior staff while sharing professional views when needed.",
            "Do not criticise other teachers in front of students or the public.",
            "Do not accept gifts or favours that could influence judgement."
          ]
        },
        {
          point: "Communication boundaries and safeguarding",
          subpoints: [
            "Use official school channels (Microsoft Teams) to communicate with students.",
            "Do not share personal phone numbers or personal social media with students.",
            "Do not create or join student communication groups (WhatsApp/Discord/Instagram/Facebook/etc.).",
            "Do not take student photos/videos for non-school purposes.",
            "Do not post student images on personal social media."
          ]
        },
        {
          point: "Staff communication",
          subpoints: [
            "WhatsApp is the official staff communication platform.",
            "Respond promptly for smooth daily operations."
          ]
        },
        {
          point: "Device and internet use at work",
          subpoints: [
            "Teachers must have their own laptop for teaching.",
            "Do not access inappropriate or non-educational websites during school hours.",
            "Keep your phone on silent during the school day.",
            "Do not use phones in class unless for school purposes or emergencies.",
            "Do not use earbuds/headphones for non-educational purposes during school hours."
          ]
        },
        {
          point: "Sexual harassment is prohibited",
          subpoints: [
            "All forms of sexual harassment are strictly prohibited.",
            "This includes unwelcome advances, teasing, jokes, remarks, threats, or physical conduct."
          ]
        },
        {
          point: "Confidentiality",
          subpoints: [
            "Student and family information (financial, personal, health, etc.) is strictly confidential.",
            "Do not discuss confidential matters in common areas.",
            "Confidentiality continues even after employment ends."
          ]
        }
      ]
    },
    {
      key: "teacher_responsibilities",
      title: "3) Teachers' Responsibilities (Subject Teachers)",
      main_points: [
        {
          point: "Teaching and planning",
          subpoints: [
            "Teach according to IGCSE requirements and check CAIE updates regularly.",
            "Be fully familiar with the subjects and content you teach.",
            "Prepare lesson plans at least one week before teaching.",
            "Keep lesson plans and timelines updated for substitute teachers."
          ]
        },
        {
          point: "Records and systems",
          subpoints: [
            "Keep up-to-date records for each class (attendance, lesson plans, homework, assessments).",
            "Update Microsoft Teams classrooms regularly.",
            "Upload notes and materials for absent students."
          ]
        },
        {
          point: "Homework and student organisation",
          subpoints: [
            "Encourage students to keep a subject file for homework, quizzes, and exams.",
            "Check student homework diaries regularly (subject + homeroom teachers)."
          ]
        },
        {
          point: "Language",
          subpoints: [
            "Use English as the main language during school hours.",
            "Exception: Chinese and Malay lessons."
          ]
        },
        {
          point: "Assessments and exams",
          subpoints: [
            "Run quizzes or projects regularly (e.g., after chapters or monthly).",
            "Keep grading rubrics.",
            "Give students at least one week notice for quizzes/projects.",
            "Submit exam papers and documents within deadlines.",
            "Follow exam invigilation and script-handling protocols.",
            "Explain the grading system to students (and parents when needed).",
            "Update grades promptly after each assessment."
          ]
        }
      ]
    },
    {
      key: "homeroom_responsibilities",
      title: "4) Homeroom Teacher Responsibilities",
      main_points: [
        {
          point: "Attendance and reporting",
          subpoints: [
            "Take daily attendance.",
            "Record attendance in Microsoft Teams.",
            "Report absentees via WhatsApp."
          ]
        },
        {
          point: "Homeroom session (7:30am–8:00am)",
          subpoints: [
            "Do daily sharing to encourage students.",
            "Help students with homework questions when needed."
          ]
        },
        {
          point: "Classroom management",
          subpoints: [
            "Create a classroom management plan (rules, consequences, rewards).",
            "Explain classroom procedures and behaviour expectations on Day 1.",
            "Apply rules fairly and consistently.",
            "Lead class to assemblies/events and model respectful behaviour."
          ]
        },
        {
          point: "Class upkeep and admin",
          subpoints: [
            "Keep classroom clean and organised.",
            "Distribute and upload forms on Microsoft Teams.",
            "Make announcements to the class."
          ]
        },
        {
          point: "Student devices",
          subpoints: [
            "Collect student electronic devices (including earphones and smart watches).",
            "Store them safely until dismissal."
          ]
        },
        {
          point: "New student onboarding",
          subpoints: [
            "Conduct orientation for new students (environment, subjects, facilities, rules)."
          ]
        },
        {
          point: "Parent and student communication",
          subpoints: [
            "All communication with parents and students must be through Microsoft Teams Channel only."
          ]
        }
      ]
    },
    {
      key: "classroom_discipline",
      title: "5) Classroom Management & Student Discipline",
      main_points: [
        {
          point: "Basic discipline approach",
          subpoints: [
            "Maintain order and discipline in class and around school.",
            "Address misbehaviour first.",
            "If needed, contact Student Affairs team or Deputy Principal."
          ]
        },
        {
          point: "Active supervision",
          subpoints: [
            "Do not remain seated during teaching.",
            "Move around to maintain control and build rapport.",
            "Correct misbehaviour immediately."
          ]
        },
        {
          point: "Consistency and incident reporting",
          subpoints: [
            "Know the Student Handbook and enforce rules consistently.",
            "For rule-breaking cases, a disciplinary meeting may be held.",
            "Students may need to complete an incident report (signed and filed by Student Affairs)."
          ]
        },
        {
          point: "Serious matters",
          subpoints: [
            "Report fighting or suspected weapons/drugs immediately to Student Affairs.",
            "Report bullying, abuse, or harassment immediately to Student Affairs or Deputy Principal."
          ]
        },
        {
          point: "Respect and safety",
          subpoints: [
            "Do not allow insulting, mocking, or sarcasm towards anyone.",
            "Students must address adults respectfully (Mr/Mrs/Ms/Sir/Madam).",
            "If a student is injured/ill, seek first-aid-trained staff and notify Deputy Principal.",
            "Do not give medication without approval from parents and Deputy Principal."
          ]
        }
      ]
    },
    {
      key: "facilities_care",
      title: "6) Facilities Care & School Compound Upkeep",
      main_points: [
        {
          point: "Cleanliness and care",
          subpoints: [
            "Keep classrooms and school areas clean and orderly.",
            "Do not allow littering or damage to school property.",
            "Report littering or damage to Student Affairs."
          ]
        },
        {
          point: "Repairs and equipment",
          subpoints: [
            "Report repairs (e.g., lights, projector) in the WhatsApp group to notify admin.",
            "Return borrowed equipment/stationery immediately after use."
          ]
        },
        {
          point: "Daily routines and security",
          subpoints: [
            "Clean whiteboards after every lesson.",
            "Keep notice boards current and relevant.",
            "Turn off lights and aircon when leaving rooms.",
            "Leave rooms neat at end of day (chairs in, tables neat, appliances off).",
            "Lock doors you unlocked when leaving."
          ]
        },
        {
          point: "Photocopying rules",
          subpoints: [
            "No photocopying for personal or non-school purposes.",
            "Use your own assigned photocopy password.",
            "Use double-sided printing whenever possible."
          ]
        },
        {
          point: "Special rooms (labs, music, library, arts)",
          subpoints: [
            "No food or drinks.",
            "Actively monitor students at all times.",
            "Never leave students alone in labs or special rooms."
          ]
        }
      ]
    },
    {
      key: "working_hours",
      title: "7) Working Hours",
      main_points: [
        {
          point: "Teacher working hours",
          subpoints: [
            "Official hours: 7:15am–4:00pm (Mon–Fri).",
            "Saturday work may be required by management."
          ]
        },
        {
          point: "Arrival and homeroom",
          subpoints: [
            "Report to work by 7:15am.",
            "Be in classroom by 7:30am for homeroom."
          ]
        },
        {
          point: "Attendance system",
          subpoints: [
            "Clock in and clock out personally every working day.",
            "Do not clock in/out for others."
          ]
        },
        {
          point: "If late",
          subpoints: [
            "Inform Management or Deputy Principal by phone as early as possible.",
            "Call between 5:00am and 6:30am on the affected day."
          ]
        },
        {
          point: "Lesson timing and preparation",
          subpoints: [
            "Start and end lessons on time.",
            "Teach the full lesson period.",
            "Prepare lesson materials one day in advance.",
            "Do not print/photocopy during an on-going lesson."
          ]
        },
        {
          point: "Schooling hours (Glenmarie Campus) - quick reference",
          subpoints: [
            "Preschool: Mon–Thu 8:00am–1:00pm; Fri 8:00am–12:30pm",
            "Year 1–2: Mon/Wed/Thu 7:30am–2:00pm; Tue (CCA) 7:30am–3:15pm; Fri 7:30am–12:30pm",
            "Year 3–6: Mon/Wed/Thu 7:30am–3:00pm; Tue (CCA) 7:30am–3:15pm; Fri 7:30am–12:30pm",
            "Year 7–11: Mon/Tue/Thu 7:30am–3:30pm; Wed (CCA) 7:30am–3:45pm; Fri 7:30am–12:30pm"
          ]
        }
      ]
    },
    {
      key: "leave_salary",
      title: "8) Leave & Salary Administration",
      main_points: [
        {
          point: "General",
          subpoints: [
            "Arrange personal appointments after school hours or during school holidays when possible."
          ]
        },
        {
          point: "Leave types (key items)",
          subpoints: [
            "Marriage leave: 2 days (first legal marriage only).",
            "Maternity leave: 98 days (up to 5 pregnancies).",
            "Paternity leave: 7 consecutive working days (up to 5 pregnancies).",
            "Compassionate leave: 3 days (next-of-kin).",
            "Time-off: up to 2 hours for emergencies (management approval). More than 2 hours becomes unpaid leave.",
            "Sick leave (non-hospitalisation): 14 days fully paid per year."
          ]
        },
        {
          point: "Sick leave procedure",
          subpoints: [
            "Notify Deputy Principal before 5:00am–6:30am (latest) on the affected day.",
            "Submit a valid medical certificate (MC)."
          ]
        },
        {
          point: "Medical claims and panel clinics",
          subpoints: [
            "Medical claim reimbursement is for panel clinics only (others are management discretion).",
            "Glenmarie panel clinic: Klinik Keluarga Lee (or Temasya 8 Clinic).",
            "Klang panel clinic: Klinik Lim & Koh (Trust Clinic)."
          ]
        },
        {
          point: "Replacement materials",
          subpoints: [
            "Maintain an up-to-date weekly lesson plan as replacement material.",
            "Make it available for replacement teachers in emergencies.",
            "Ensure it is clear, level-appropriate, and period-specific."
          ]
        },
        {
          point: "Salary and MC submission",
          subpoints: [
            "Salary is credited between the 28th and the 3rd (processing dependent).",
            "Salary must be paid no later than the 7th of the following month.",
            "Submit MCs to HR by the 15th each month.",
            "Late MC/claims are processed in the next month's payroll cycle."
          ]
        }
      ]
    },
    {
      key: "duty_cca",
      title: "9) Duty, CCA/ECA & Meetings",
      main_points: [
        {
          point: "Duty roster",
          subpoints: [
            "Be on time for Morning Duty, Canteen Duty, and Dismissal Duty.",
            "Anticipate risks and guide student movement for safety."
          ]
        },
        {
          point: "Staff meetings",
          subpoints: [
            "Weekly Staff Meeting: Every Friday, 1:30pm–4:00pm.",
            "Attendance is compulsory.",
            "Additional meetings will be informed in advance."
          ]
        },
        {
          point: "Assemblies and activities",
          subpoints: [
            "Teachers must be present and sit with assigned groups during assemblies and co-curricular activities.",
            "Maintain discipline of assigned groups."
          ]
        },
        {
          point: "PTM and school events",
          subpoints: [
            "Attend Parent-Teacher Meetings when scheduled.",
            "Prepare a detailed report for parents.",
            "Teachers may be required to represent Collinz at open days, roadshows, and education fairs.",
            "Attendance is compulsory for school events (PTM, open days, sports, field trips, etc.)."
          ]
        }
      ]
    },
    {
      key: "dress_code",
      title: "10) Dress Code",
      main_points: [
        {
          point: "General standard",
          subpoints: [
            "Dress professionally at all times.",
            "No clothing/jewellery with inappropriate messages or images.",
            "Teacher standard must be equal to or higher than student dress code."
          ]
        },
        {
          point: "Bottoms",
          subpoints: [
            "Dresses/skirts must be at least knee-length.",
            "No jeans, leggings, short skirts, or shorts.",
            "Pants must not be shorter than ankle length."
          ]
        },
        {
          point: "Tops",
          subpoints: [
            "No tight, sheer, or revealing clothing.",
            "Wear neat button-down shirts or blouses.",
            "Sleeveless blouse must include cardigan/jacket/blazer.",
            "No hoodies or T-shirts (except CCA)."
          ]
        },
        {
          point: "Grooming and appearance",
          subpoints: [
            "Hair colour must be natural or dark brown.",
            "Hair must be neat and well-groomed.",
            "Male facial hair must be clean and neatly trimmed.",
            "Only clear or nude nail polish is allowed.",
            "One piercing per earlobe only (simple studs). Extra piercings use transparent studs.",
            "Tattoos must be covered/hidden."
          ]
        },
        {
          point: "CCA / sports / field trips",
          subpoints: [
            "Wear Collinz School T-shirt for CCA/PE/ECA, sports events, and field trips.",
            "Outdoor CCA: Maroon Collinz jersey.",
            "Indoor CCA or school events: Black Collinz polo T-shirt.",
            "Pair with track pants/trousers and sports shoes."
          ]
        },
        {
          point: "Access card and Batik day",
          subpoints: [
            "Carry Collinz access card during school hours.",
            "Report lost access cards to Deputy Principals (penalty applies).",
            "Thursday is Batik Day. Teachers are encouraged to wear batik."
          ]
        }
      ]
    },
    {
      key: "key_sops",
      title: "11) Key SOPs (Appendix Highlights)",
      main_points: [
        {
          point: "Lesson Plan & Reflection SOP",
          subpoints: [
            "Subject teachers prepare a lesson timeline and place it in the lesson plan folder.",
            "Teachers in the same campus, same subject and year share the same timeline.",
            "Update completion dates weekly.",
            "HoDs/coordinators check suitability and updates.",
            "Complete reflection forms after every lesson."
          ]
        },
        {
          point: "Discipline Cases SOP (Teacher Guide)",
          subpoints: [
            "Applies to misconduct, safety concerns, conflicts, repeated disruption, and all incidents during school activities (on/off campus).",
            "Incident reports are required for serious incidents, repeated misbehaviour, and safety-related matters.",
            "Records are confidential.",
            "Step 1: Teacher handles minor cases. Report major cases to Student Affairs (or Assistant Principal/Deputy Principal if needed).",
            "Teachers must not manage serious discipline cases independently.",
            "Step 2: School leadership investigates (avoid meeting students alone).",
            "Step 3: Leadership decides and follows up (incident report, student meeting, parent contact, etc.)."
          ]
        },
        {
          point: "Teacher appraisal periods (2026)",
          subpoints: [
            "Appraisal 1: Mar 2 – Apr 24 (Week 8 – Week 13).",
            "Appraisal 2: Jul 20 – Sep 11 (Week 24 – Week 30)."
          ]
        },
        {
          point: "Academic exam timeline (2026) - quick reference",
          subpoints: [
            "Y1–2: MYE revision (W14–15) 27 Apr–8 May; exams (W16) 11–13 May; discussion (W17) 14–22 May. YEE revision (W32–33) 21 Sep–7 Oct; exams (W34) 6–8 Oct; discussion (W35) 9–16 Oct.",
            "Y3–6: MYE revision (W14–15) 27 Apr–8 May; exams (W16) 11–14 May; discussion (W17) 15–22 May. YEE revision (W32–33) 21 Sep–5 Oct; exams (W34) 6–9 Oct; discussion (W35) 12–16 Oct.",
            "Y7–8: MYE revision (W14–15) 27 Apr–8 May; exams (W16) 11–15 May; discussion (W17–18) 18–29 May. YEE revision (W32–33) 21 Sep–2 Oct; exams (W34) 5–9 Oct; discussion (W35–36) 12–23 Oct.",
            "Y9–11: Y10 Feb trial (W6) 10–12 Feb. MYE revision (W14) 27–30 Apr; exams (W15–16) 4–15 May; discussion (W17–18) 18–29 May. Y11 Aug trial (W26–27) 3–14 Aug. YEE revision (W32) 21–25 Sep; exams (W33–34) 28 Sep–9 Oct; discussion (W35–38) 12 Oct–6 Nov."
          ]
        }
      ]
    },
    {
      key: "acknowledgement",
      title: "12) Acknowledgement",
      main_points: [
        {
          point: "Teacher acknowledgement",
          subpoints: [
            "Teacher confirms they have read and understood the Teacher's Handbook 2026.",
            "Teacher agrees to abide by it.",
            "Teacher signs and dates the acknowledgement."
          ]
        }
      ]
    }
  ]
};

export const sectionColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  school_direction: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
    dot: "bg-blue-500"
  },
  teacher_conduct: {
    bg: "bg-rose-100 dark:bg-rose-900/30",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-800",
    dot: "bg-rose-500"
  },
  teacher_responsibilities: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500"
  },
  homeroom_responsibilities: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500"
  },
  classroom_discipline: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800",
    dot: "bg-purple-500"
  },
  facilities_care: {
    bg: "bg-teal-100 dark:bg-teal-900/30",
    text: "text-teal-600 dark:text-teal-400",
    border: "border-teal-200 dark:border-teal-800",
    dot: "bg-teal-500"
  },
  working_hours: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-600 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800",
    dot: "bg-orange-500"
  },
  leave_salary: {
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
    text: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-200 dark:border-indigo-800",
    dot: "bg-indigo-500"
  },
  duty_cca: {
    bg: "bg-cyan-100 dark:bg-cyan-900/30",
    text: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-200 dark:border-cyan-800",
    dot: "bg-cyan-500"
  },
  dress_code: {
    bg: "bg-pink-100 dark:bg-pink-900/30",
    text: "text-pink-600 dark:text-pink-400",
    border: "border-pink-200 dark:border-pink-800",
    dot: "bg-pink-500"
  },
  key_sops: {
    bg: "bg-slate-100 dark:bg-slate-900/30",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-200 dark:border-slate-800",
    dot: "bg-slate-500"
  },
  acknowledgement: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-600 dark:text-green-400",
    border: "border-green-200 dark:border-green-800",
    dot: "bg-green-500"
  }
};
