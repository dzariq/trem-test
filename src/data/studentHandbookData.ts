export interface StudentHandbookSubsection {
  subtitle: string;
  points: string[];
}

export interface StudentHandbookSection {
  key: string;
  title: string;
  color: string;
  lightBg: string;
  subsections: StudentHandbookSubsection[];
}

export interface StudentHandbookData {
  module: string;
  academic_year: string;
  sections: StudentHandbookSection[];
}

export const studentHandbookData: StudentHandbookData = {
  module: "Student Handbook",
  academic_year: "2026",
  sections: [
    {
      key: "mission_vision",
      title: "1) Mission, Vision & Core Values",
      color: "text-emerald-600",
      lightBg: "bg-emerald-50",
      subsections: [
        {
          subtitle: "Vision",
          points: [
            "Instil 21st century skills.",
            "Inspire lifelong learning.",
            "Build meaningful partnerships with parents and guardians.",
            "Sow the seeds of excellence and cultivate young minds."
          ]
        },
        {
          subtitle: "Mission",
          points: [
            "Nourish young minds in a safe, stimulating, and collaborative environment.",
            "Develop character with guidance from dedicated educators.",
            "Focus on inquiry-based learning for academic excellence."
          ]
        },
        {
          subtitle: "Core Values (FAMILY)",
          points: [
            "F: Fulfilling social and emotional needs.",
            "A: Achieving excellence.",
            "M: Maximising potential.",
            "I: Integrating thinking skills.",
            "L: Learning to engage.",
            "Y: Learning to learn."
          ]
        }
      ]
    },
    {
      key: "learner_skills",
      title: "2) Collinz Learner Skills",
      color: "text-blue-600",
      lightBg: "bg-blue-50",
      subsections: [
        {
          subtitle: "Nurturing Young Minds",
          points: [
            "Explore to learn.",
            "Inquiry learning.",
            "Learning through reflection."
          ]
        },
        {
          subtitle: "Cultivating a Quest for Knowledge",
          points: [
            "Cultivate young leaders.",
            "Engagement and collaboration.",
            "Think out of the box."
          ]
        },
        {
          subtitle: "Broadening Worldview",
          points: [
            "Knowledge beyond classroom.",
            "Embrace diversity.",
            "Think analytically."
          ]
        },
        {
          subtitle: "Practising Well-Balanced Lifestyle",
          points: [
            "Develop social and emotional strength.",
            "Live a healthy lifestyle.",
            "Priority management."
          ]
        },
        {
          subtitle: "Upholding Values",
          points: [
            "Lead with integrity.",
            "Strong moral compass.",
            "Give back to our community."
          ]
        }
      ]
    },
    {
      key: "student_pledge",
      title: "3) Student Pledge",
      color: "text-purple-600",
      lightBg: "bg-purple-50",
      subsections: [
        {
          subtitle: "What Students Commit To",
          points: [
            "Keep high standards and aim for excellence.",
            "Act with integrity and dignity.",
            "Respect diversity and equal opportunity.",
            "Uphold the honour and reputation of the Collinz community.",
            "Pursue wisdom and apply knowledge responsibly."
          ]
        }
      ]
    },
    {
      key: "rules_belongings",
      title: "4) Rules: Belongings & Devices",
      color: "text-amber-600",
      lightBg: "bg-amber-50",
      subsections: [
        {
          subtitle: "Required Materials",
          points: [
            "Bring necessary stationery, textbooks, and workbooks to lessons.",
            "Primary students should not bring mechanical pencils; they are not allowed in Cambridge exams."
          ]
        },
        {
          subtitle: "Prohibited Items",
          points: [
            "Do not bring paper knives, craft knives, or scissors.",
            "Do not bring valuables or excessive money; school is not liable for loss or damage.",
            "Do not eat in class unless medically certified.",
            "No chewing gum or lollipops in school.",
            "Card games and board games are prohibited unless approved via appeal."
          ]
        },
        {
          subtitle: "Electronic Devices",
          points: [
            "Smartwatches are not allowed.",
            "Mobile phones and digital gadgets are discouraged; if brought, declare and surrender to homeroom teacher.",
            "Use of electronic devices is only for education or emergencies with teacher consent.",
            "Unauthorized device use can lead to confiscation and disciplinary action."
          ]
        }
      ]
    },
    {
      key: "rules_attendance",
      title: "5) Rules: Attendance & Punctuality",
      color: "text-rose-600",
      lightBg: "bg-rose-50",
      subsections: [
        {
          subtitle: "Arrival & Punctuality",
          points: [
            "Stay within school compound during school hours unless written permission is granted.",
            "Be in school by 7:30am for homeroom.",
            "Tardy 3 or more times in a month triggers a call to home."
          ]
        },
        {
          subtitle: "Absence Reporting",
          points: [
            "If absent, parents must send an explanatory note to administrators.",
            "If unwell, stay at home; submit medical certificate within 3 days when possible.",
            "Contagious illnesses require quarantine compliance and a fitness certificate before returning."
          ]
        },
        {
          subtitle: "Absence Consequences",
          points: [
            "Continuous absence for 3 days or recurring absenteeism may require parent meeting with principal/deputy.",
            "No communication for 5 continuous days: school sends a memo on the 6th school day.",
            "No response within 7 days after memo can lead to suspension.",
            "Unexcused absences over 20% of a term or serious attendance misconduct can lead to suspension or expulsion."
          ]
        }
      ]
    },
    {
      key: "rules_attire",
      title: "6) Rules: Attire & Appearance",
      color: "text-teal-600",
      lightBg: "bg-teal-50",
      subsections: [
        {
          subtitle: "Uniform Requirements",
          points: [
            "Wear designated uniform with name tag, black socks, and black shoes.",
            "Uniform is required Monday to Friday, except specified days; CCA days use Collinz sports attire.",
            "School sweaters may be worn in class if cold.",
            "Sports attire is only for PE/CCA/extra-curricular activities."
          ]
        },
        {
          subtitle: "Prohibited Attire",
          points: [
            "Prohibited attire includes revealing clothing, very short skirts/shorts, singlets, sleeveless tops, leggings, cosmetics, high heels, caps/hats, and offensive wording.",
            "Overly loose or extremely tight clothing is not allowed."
          ]
        },
        {
          subtitle: "Hair & Accessories",
          points: [
            "Hair dye is not allowed; only natural hair colour.",
            "If hair is longer than shoulder length, tie it up with approved colours.",
            "Piercing rules apply (simple stud earrings only; limited piercings)."
          ]
        }
      ]
    },
    {
      key: "rules_behaviour",
      title: "7) Rules: Behaviour in School",
      color: "text-indigo-600",
      lightBg: "bg-indigo-50",
      subsections: [
        {
          subtitle: "Behaviour Within School Compound",
          points: [
            "Vandalism or destruction of property will be charged and/or require community service.",
            "Report damaged or faulty items immediately.",
            "No running, shouting, or screaming in school premises.",
            "Keep to the left on staircases and corridors.",
            "No loitering in corridors, lobby, or office areas, even during break/lunch/dismissal.",
            "School may conduct random spot checks.",
            "Maintain appropriate physical distance and respect boundaries.",
            "No unapproved buying/selling or business transactions among students.",
            "Do not enter a toilet cubicle with a student of a different gender."
          ]
        },
        {
          subtitle: "Parent/Guardian School Visits",
          points: [
            "Parents/guardians are only allowed for drop-off/pick-up or official matters at the admin office.",
            "Visits must be by appointment via email or telephone.",
            "Parents/guardians must wait at the office for arrangements.",
            "No parent/guardian may enter the compound unaccompanied."
          ]
        }
      ]
    },
    {
      key: "rules_meals",
      title: "8) Rules: Meals",
      color: "text-orange-600",
      lightBg: "bg-orange-50",
      subsections: [
        {
          subtitle: "Meal Subscription",
          points: [
            "Snack and lunch can be subscribed (optional) with extra charge.",
            "Home-cooked meals require students to bring their own cutlery and crockery."
          ]
        },
        {
          subtitle: "Food Restrictions",
          points: [
            "Food brought in must be free of pork and beef.",
            "No ordering food via online delivery services.",
            "Students cannot leave school to buy food during school hours or dismissal time."
          ]
        },
        {
          subtitle: "Food Drop-off & Water",
          points: [
            "Meal drop-off is done with the security guard at the designated block.",
            "External food delivery must be clearly labelled for identification.",
            "Water dispenser refills are only during break or lunch."
          ]
        }
      ]
    },
    {
      key: "exam_rules",
      title: "9) Examination Rules",
      color: "text-cyan-600",
      lightBg: "bg-cyan-50",
      subsections: [
        {
          subtitle: "Attendance & Timing",
          points: [
            "All school rules apply during exam periods.",
            "Full school uniform is compulsory for all exams.",
            "Arrive at least 10 minutes before the exam starts.",
            "Arriving 10 minutes after the exam starts without valid reason means you may not sit for the exam.",
            "No extra time is given to latecomers.",
            "Stay in the exam room for the full session."
          ]
        },
        {
          subtitle: "Absence & Rescheduling",
          points: [
            "Medical absence must be informed before exam date; reschedule needs medical certificate.",
            "If absent without valid reason, a replacement exam may be allowed but result is not recorded; report shows 'ABS'.",
            "Request special access arrangements at least 5 working days before exam with supporting documents."
          ]
        },
        {
          subtitle: "Allowed & Prohibited Items",
          points: [
            "Year 1–4 may write with pencil; Year 5–11 use dark blue/black pen (pencil only for diagrams).",
            "No food/drinks in exam room unless medically supported.",
            "Bring required stationery (e.g., calculator, geometry set).",
            "Surrender phones/tablets/smart watches/communication devices before entering.",
            "Only transparent pencil case and transparent water tumbler are allowed; no calculator cases.",
            "No books, notes, files, folders in the exam room."
          ]
        },
        {
          subtitle: "Exam Conduct",
          points: [
            "No toilet for exams under 2 hours unless emergency.",
            "No disruptive behaviour; invigilators can penalize."
          ]
        }
      ]
    },
    {
      key: "discipline",
      title: "10) Discipline",
      color: "text-red-600",
      lightBg: "bg-red-50",
      subsections: [
        {
          subtitle: "Disciplinary Approach",
          points: [
            "High standards of discipline, behaviour, manners, and attire are expected.",
            "School uses positive reinforcement to encourage good behaviour.",
            "Bullying (physical, verbal, written, cyber) is not tolerated.",
            "Serious breaches can lead to suspension and eventually expulsion.",
            "If misconduct breaks Malaysian law, the school may lodge a police report."
          ]
        },
        {
          subtitle: "Minor Offences",
          points: [
            "Minor offences disrupt the community without intent to be disrespectful or dishonest.",
            "Process: 2 verbal warnings → warning letter + parents informed → possible suspension if continued.",
            "Examples: disruptive behaviour, dress code violation, littering, repeated missing homework/materials, unauthorized device use, disrespect to staff, obscene language, inappropriate gender-related conduct."
          ]
        },
        {
          subtitle: "Major Offences",
          points: [
            "Major offences cause or risk significant harm or deception; discipline board decides actions.",
            "Major offences can result in immediate expulsion, suspension, or expulsion.",
            "Key categories: dishonouring school on social media/public, alcohol, drugs, arson, assault/threats, bullying/fighting/extortion/defamation, gangsterism, cheating in exams, forgery/plagiarism, gambling, pornographic materials, weapons, rioting/unlawful assembly, sexual assault, sexual harassment, smoking/vaping, theft, trespassing/leaving school without permission, unauthorised fundraising using school's name, vandalism, hacking/misuse of systems/devices, unapproved business transactions."
          ]
        },
        {
          subtitle: "School Rights",
          points: [
            "Enrolment means students and parents agree to follow the rules.",
            "School may terminate enrolment for breaches without refund of deposits/fees.",
            "School may amend or add rules without notice; changes become binding once circulated."
          ]
        }
      ]
    },
    {
      key: "behaviour_contract",
      title: "11) Student Behaviour Contract",
      color: "text-pink-600",
      lightBg: "bg-pink-50",
      subsections: [
        {
          subtitle: "Student & Parent Acknowledgement",
          points: [
            "Student confirms they have read and understood their responsibilities.",
            "Student commits to contribute positively to the school community.",
            "Student commits to encourage others and lead by example.",
            "Student and parent/guardian sign and return as required."
          ]
        }
      ]
    }
  ]
};
