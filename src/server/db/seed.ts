/**
 * Seed Data for Rawafid Platform
 * Creates: 1 Tenant, 100 Employees (20 Mentors, 30 Mentees, 50 Employees)
 * Plus: 5 active matches, 10 sessions, 3 development plans
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
// dotenv loaded via tsx --env-file or process.env

// env loaded externally

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

// ===== CONSTANTS =====

const TENANT_ID = nanoid();

const EXPERTISE_AREAS = [
  { id: "cybersecurity", nameAr: "الأمن السيبراني", nameEn: "Cybersecurity" },
  { id: "digital_transformation", nameAr: "التحول الرقمي", nameEn: "Digital Transformation" },
  { id: "systems_development", nameAr: "تطوير الأنظمة", nameEn: "Systems Development" },
  { id: "infrastructure", nameAr: "البنية التحتية", nameEn: "IT Infrastructure" },
  { id: "talent_development", nameAr: "تطوير المواهب", nameEn: "Talent Development" },
  { id: "performance_management", nameAr: "إدارة الأداء", nameEn: "Performance Management" },
  { id: "workforce_planning", nameAr: "تخطيط القوى العاملة", nameEn: "Workforce Planning" },
  { id: "budget_management", nameAr: "إدارة الميزانيات", nameEn: "Budget Management" },
  { id: "financial_analysis", nameAr: "التحليل المالي", nameEn: "Financial Analysis" },
  { id: "corporate_communication", nameAr: "التواصل المؤسسي", nameEn: "Corporate Communication" },
  { id: "brand_management", nameAr: "إدارة العلامة التجارية", nameEn: "Brand Management" },
  { id: "project_management", nameAr: "إدارة المشاريع", nameEn: "Project Management" },
  { id: "process_improvement", nameAr: "تحسين العمليات", nameEn: "Process Improvement" },
  { id: "governance", nameAr: "الحوكمة", nameEn: "Governance" },
  { id: "compliance", nameAr: "الامتثال", nameEn: "Compliance" },
  { id: "strategic_planning", nameAr: "التخطيط الاستراتيجي", nameEn: "Strategic Planning" },
  { id: "change_management", nameAr: "إدارة التغيير", nameEn: "Change Management" },
  { id: "business_development", nameAr: "تطوير الأعمال", nameEn: "Business Development" },
  { id: "customer_experience", nameAr: "تجربة العميل", nameEn: "Customer Experience" },
  { id: "complaints_management", nameAr: "إدارة الشكاوى", nameEn: "Complaints Management" },
];

const SKILLS = [
  { id: "leadership", nameAr: "قيادة الفرق", nameEn: "Team Leadership" },
  { id: "data_analysis", nameAr: "تحليل البيانات", nameEn: "Data Analysis" },
  { id: "project_management", nameAr: "إدارة المشاريع", nameEn: "Project Management" },
  { id: "strategic_planning", nameAr: "التخطيط الاستراتيجي", nameEn: "Strategic Planning" },
  { id: "change_management", nameAr: "إدارة التغيير", nameEn: "Change Management" },
  { id: "communication", nameAr: "مهارات التواصل", nameEn: "Communication Skills" },
  { id: "negotiation", nameAr: "التفاوض", nameEn: "Negotiation" },
  { id: "problem_solving", nameAr: "حل المشكلات", nameEn: "Problem Solving" },
  { id: "policy_development", nameAr: "تطوير السياسات", nameEn: "Policy Development" },
  { id: "risk_management", nameAr: "إدارة المخاطر", nameEn: "Risk Management" },
  { id: "budget_management", nameAr: "إدارة الميزانيات", nameEn: "Budget Management" },
  { id: "digital_transformation", nameAr: "التحول الرقمي", nameEn: "Digital Transformation" },
  { id: "cybersecurity", nameAr: "الأمن السيبراني", nameEn: "Cybersecurity" },
  { id: "performance_management", nameAr: "إدارة الأداء", nameEn: "Performance Management" },
  { id: "business_development", nameAr: "تطوير الأعمال", nameEn: "Business Development" },
];

// Department list available via @/lib/constants for app usage.

// ===== MENTOR DATA (20 mentors) =====

const MENTORS_DATA = [
  // IT (4)
  {
    name: "م. خالد بن عبدالرحمن العتيبي",
    nameEn: "Khalid Al-Otaibi",
    email: "khalid.otaibi@goid.gov.sa",
    department: "تقنية المعلومات",
    jobTitle: "مدير إدارة التحول الرقمي",
    jobTitleEn: "Digital Transformation Director",
    years: 18,
    areas: ["digital_transformation", "systems_development"],
    skills: ["digital_transformation", "project_management", "leadership", "change_management"],
    motivation: "أؤمن بأن التحول الرقمي هو مستقبل كل مؤسسة، وأريد مساعدة الزملاء على اكتساب المهارات اللازمة لقيادة هذا التحول بثقة ووعي.",
    motivationEn: "I believe digital transformation is the future of every organization and want to help colleagues develop skills to lead it confidently.",
    availability: [{ day: "monday", from: "10:00", to: "14:00" }, { day: "wednesday", from: "10:00", to: "14:00" }],
    maxMentees: 4,
    sessionPref: "both" as const,
    rating: 45,
    totalRatings: 8,
  },
  {
    name: "أ. ريم بنت عبدالله القحطاني",
    nameEn: "Reem Al-Qahtani",
    email: "reem.qahtani@goid.gov.sa",
    department: "تقنية المعلومات",
    jobTitle: "رئيسة قسم الأمن السيبراني",
    jobTitleEn: "Cybersecurity Section Head",
    years: 12,
    areas: ["cybersecurity"],
    skills: ["cybersecurity", "risk_management", "policy_development", "leadership"],
    motivation: "الأمن السيبراني مجال متطور باستمرار، وأرى من مسؤوليتي مساعدة الكوادر الشابة على مواكبة التطورات وبناء قدرات دفاعية قوية.",
    motivationEn: "Cybersecurity is constantly evolving; I feel it's my responsibility to help young professionals keep up with developments.",
    availability: [{ day: "sunday", from: "08:00", to: "12:00" }, { day: "tuesday", from: "13:00", to: "17:00" }],
    maxMentees: 3,
    sessionPref: "virtual" as const,
    rating: 48,
    totalRatings: 5,
  },
  {
    name: "م. سلطان بن فهد الشهري",
    nameEn: "Sultan Al-Shahri",
    email: "sultan.shahri@goid.gov.sa",
    department: "تقنية المعلومات",
    jobTitle: "مدير تطوير الأنظمة",
    jobTitleEn: "Systems Development Manager",
    years: 14,
    areas: ["systems_development", "digital_transformation"],
    skills: ["digital_transformation", "project_management", "problem_solving", "data_analysis"],
    motivation: "أرغب في مشاركة خبرتي في بناء الأنظمة وتطوير الحلول الرقمية لمساعدة الموظفين على الانتقال من المفاهيم النظرية إلى التطبيق الفعلي.",
    motivationEn: "I want to share my experience in systems development to help employees bridge theory and practical application.",
    availability: [{ day: "monday", from: "13:00", to: "17:00" }, { day: "thursday", from: "09:00", to: "13:00" }],
    maxMentees: 3,
    sessionPref: "both" as const,
    rating: 42,
    totalRatings: 6,
  },
  {
    name: "أ. نورة بنت حمد المطيري",
    nameEn: "Noura Al-Mutairi",
    email: "noura.mutairi@goid.gov.sa",
    department: "تقنية المعلومات",
    jobTitle: "مديرة البنية التحتية",
    jobTitleEn: "Infrastructure Manager",
    years: 15,
    areas: ["infrastructure", "cybersecurity"],
    skills: ["cybersecurity", "risk_management", "leadership", "problem_solving"],
    motivation: "البنية التحتية هي العمود الفقري للتحول الرقمي، وأسعى لمساعدة الزملاء على فهم كيفية بناء بيئات تقنية موثوقة ومستدامة.",
    motivationEn: "Infrastructure is the backbone of digital transformation, and I aim to help colleagues build reliable and sustainable tech environments.",
    availability: [{ day: "wednesday", from: "08:00", to: "12:00" }, { day: "thursday", from: "13:00", to: "17:00" }],
    maxMentees: 2,
    sessionPref: "in_person" as const,
    rating: 44,
    totalRatings: 4,
  },
  // HR (3)
  {
    name: "د. نورة بنت سعد الشمري",
    nameEn: "Dr. Noura Al-Shammari",
    email: "noura.shammari@goid.gov.sa",
    department: "الموارد البشرية",
    jobTitle: "مديرة تطوير المواهب",
    jobTitleEn: "Talent Development Director",
    years: 15,
    areas: ["talent_development", "performance_management"],
    skills: ["talent_development", "performance_management", "communication", "leadership"],
    motivation: "الموارد البشرية هي الأصل الحقيقي لكل مؤسسة، وأريد مساعدة الموظفين على اكتشاف إمكاناتهم وتطوير مساراتهم المهنية بشكل مستدام.",
    motivationEn: "People are an organization's greatest asset, and I want to help employees discover their potential and develop sustainable career paths.",
    availability: [{ day: "sunday", from: "09:00", to: "13:00" }, { day: "tuesday", from: "09:00", to: "13:00" }],
    maxMentees: 5,
    sessionPref: "both" as const,
    rating: 49,
    totalRatings: 12,
  },
  {
    name: "أ. عبدالعزيز بن محمد الحربي",
    nameEn: "Abdulaziz Al-Harbi",
    email: "abdulaziz.harbi@goid.gov.sa",
    department: "الموارد البشرية",
    jobTitle: "مدير إدارة الأداء",
    jobTitleEn: "Performance Management Manager",
    years: 11,
    areas: ["performance_management"],
    skills: ["performance_management", "leadership", "communication", "data_analysis"],
    motivation: "إدارة الأداء الفعّالة ترتبط مباشرة بتطوير الموظفين ونجاح المؤسسة. أريد مساعدة قادة الفرق على تطبيق منهجيات أداء متطورة.",
    motivationEn: "Effective performance management directly impacts employee development and organizational success. I want to help team leaders apply advanced methodologies.",
    availability: [{ day: "monday", from: "09:00", to: "13:00" }, { day: "wednesday", from: "13:00", to: "17:00" }],
    maxMentees: 3,
    sessionPref: "both" as const,
    rating: 43,
    totalRatings: 7,
  },
  {
    name: "أ. هيا بنت ناصر الدوسري",
    nameEn: "Haya Al-Dossari",
    email: "haya.dossari@goid.gov.sa",
    department: "الموارد البشرية",
    jobTitle: "مديرة تخطيط القوى العاملة",
    jobTitleEn: "Workforce Planning Manager",
    years: 13,
    areas: ["workforce_planning", "talent_development"],
    skills: ["workforce_planning", "data_analysis", "strategic_planning", "policy_development"],
    motivation: "تخطيط القوى العاملة علم وفن في آنٍ معاً. أرغب في مشاركة الأدوات والمنهجيات التي تساعد المؤسسات على بناء فرق متكاملة ومستدامة.",
    motivationEn: "Workforce planning is both science and art. I want to share tools and methodologies that help organizations build integrated and sustainable teams.",
    availability: [{ day: "tuesday", from: "10:00", to: "14:00" }, { day: "thursday", from: "10:00", to: "14:00" }],
    maxMentees: 3,
    sessionPref: "virtual" as const,
    rating: 46,
    totalRatings: 6,
  },
  // Finance (2)
  {
    name: "أ. محمد بن عبدالله الغامدي",
    nameEn: "Mohammed Al-Ghamdi",
    email: "mohammed.ghamdi@goid.gov.sa",
    department: "المالية",
    jobTitle: "مدير إدارة الميزانيات",
    jobTitleEn: "Budget Management Director",
    years: 20,
    areas: ["budget_management", "financial_analysis"],
    skills: ["budget_management", "data_analysis", "risk_management", "strategic_planning"],
    motivation: "الإدارة المالية السليمة أساس استدامة المؤسسات. أريد مساعدة القيادات الوسطى على اتخاذ قرارات مالية مبنية على بيانات وتحليل دقيق.",
    motivationEn: "Sound financial management is the foundation of sustainable organizations. I want to help middle managers make data-driven financial decisions.",
    availability: [{ day: "sunday", from: "10:00", to: "14:00" }, { day: "wednesday", from: "10:00", to: "14:00" }],
    maxMentees: 3,
    sessionPref: "in_person" as const,
    rating: 47,
    totalRatings: 9,
  },
  {
    name: "أ. سارة بنت خالد العمري",
    nameEn: "Sara Al-Omari",
    email: "sara.omari@goid.gov.sa",
    department: "المالية",
    jobTitle: "مديرة التحليل المالي",
    jobTitleEn: "Financial Analysis Manager",
    years: 10,
    areas: ["financial_analysis"],
    skills: ["financial_analysis", "data_analysis", "risk_management", "problem_solving"],
    motivation: "التحليل المالي مهارة يحتاجها كل مدير بغض النظر عن تخصصه. أريد مساعدة الزملاء على قراءة الأرقام وترجمتها لقرارات استراتيجية.",
    motivationEn: "Financial analysis is a skill every manager needs regardless of specialization. I want to help colleagues read numbers and translate them into strategic decisions.",
    availability: [{ day: "monday", from: "14:00", to: "17:00" }, { day: "thursday", from: "14:00", to: "17:00" }],
    maxMentees: 3,
    sessionPref: "both" as const,
    rating: 44,
    totalRatings: 5,
  },
  // Marketing (2)
  {
    name: "أ. عمر بن سعد القرني",
    nameEn: "Omar Al-Qarni",
    email: "omar.qarni@goid.gov.sa",
    department: "التسويق والاتصال",
    jobTitle: "مدير التواصل المؤسسي",
    jobTitleEn: "Corporate Communication Manager",
    years: 16,
    areas: ["corporate_communication"],
    skills: ["communication", "leadership", "change_management", "negotiation"],
    motivation: "التواصل الفعّال هو المفتاح لنجاح كل مبادرة مؤسسية. أريد مساعدة الزملاء على بناء مهارات التواصل المؤسسي والتأثير الإيجابي.",
    motivationEn: "Effective communication is the key to success for every organizational initiative. I want to help colleagues build institutional communication skills.",
    availability: [{ day: "sunday", from: "13:00", to: "17:00" }, { day: "tuesday", from: "13:00", to: "17:00" }],
    maxMentees: 4,
    sessionPref: "both" as const,
    rating: 46,
    totalRatings: 8,
  },
  {
    name: "أ. منى بنت إبراهيم السبيعي",
    nameEn: "Mona Al-Subaie",
    email: "mona.subaie@goid.gov.sa",
    department: "التسويق والاتصال",
    jobTitle: "مديرة إدارة العلامة التجارية",
    jobTitleEn: "Brand Management Manager",
    years: 9,
    areas: ["brand_management", "corporate_communication"],
    skills: ["communication", "change_management", "problem_solving", "leadership"],
    motivation: "بناء العلامة التجارية المؤسسية يتطلب رؤية واضحة واتساقاً في الرسائل. أريد مساعدة فرق الاتصال على تطوير استراتيجياتها.",
    motivationEn: "Building institutional brand requires clear vision and message consistency. I want to help communication teams develop their strategies.",
    availability: [{ day: "wednesday", from: "09:00", to: "13:00" }, { day: "thursday", from: "09:00", to: "13:00" }],
    maxMentees: 3,
    sessionPref: "virtual" as const,
    rating: 41,
    totalRatings: 4,
  },
  // Operations (2)
  {
    name: "أ. فهد بن محمد الدوسري",
    nameEn: "Fahad Al-Dossari",
    email: "fahad.dossari@goid.gov.sa",
    department: "العمليات",
    jobTitle: "مدير التخطيط الاستراتيجي",
    jobTitleEn: "Strategic Planning Manager",
    years: 22,
    areas: ["strategic_planning", "project_management"],
    skills: ["strategic_planning", "project_management", "leadership", "change_management"],
    motivation: "العمل الاستراتيجي يحتاج تفكيراً منهجياً وطويل المدى. أريد مساعدة الكوادر الواعدة على تطوير منظور استراتيجي شامل.",
    motivationEn: "Strategic work requires systematic and long-term thinking. I want to help promising professionals develop a comprehensive strategic perspective.",
    availability: [{ day: "monday", from: "08:00", to: "12:00" }, { day: "wednesday", from: "08:00", to: "12:00" }],
    maxMentees: 4,
    sessionPref: "both" as const,
    rating: 50,
    totalRatings: 15,
  },
  {
    name: "أ. لمياء بنت علي الزهراني",
    nameEn: "Lamia Al-Zahrani",
    email: "lamia.zahrani@goid.gov.sa",
    department: "العمليات",
    jobTitle: "مديرة تحسين العمليات",
    jobTitleEn: "Process Improvement Manager",
    years: 12,
    areas: ["process_improvement", "project_management"],
    skills: ["project_management", "problem_solving", "data_analysis", "change_management"],
    motivation: "تحسين العمليات هو الطريق لرفع الكفاءة وتقليل الهدر. أريد مساعدة الفرق على تبني منهجيات التحسين المستمر.",
    motivationEn: "Process improvement is the path to higher efficiency and less waste. I want to help teams adopt continuous improvement methodologies.",
    availability: [{ day: "tuesday", from: "08:00", to: "12:00" }, { day: "thursday", from: "08:00", to: "12:00" }],
    maxMentees: 3,
    sessionPref: "in_person" as const,
    rating: 43,
    totalRatings: 6,
  },
  // Legal (2)
  {
    name: "أ. عبدالله بن أحمد المالكي",
    nameEn: "Abdullah Al-Maliki",
    email: "abdullah.maliki@goid.gov.sa",
    department: "الشؤون القانونية",
    jobTitle: "مدير الحوكمة والامتثال",
    jobTitleEn: "Governance & Compliance Director",
    years: 17,
    areas: ["governance", "compliance"],
    skills: ["governance", "policy_development", "risk_management", "communication"],
    motivation: "الحوكمة والامتثال ليسا قيداً بل ضماناً للاستدامة. أريد مساعدة المديرين على فهم أهمية الإطار التنظيمي واتخاذ قرارات تتوافق معه.",
    motivationEn: "Governance and compliance are not constraints but guarantees of sustainability. I want to help managers understand regulatory frameworks.",
    availability: [{ day: "sunday", from: "08:00", to: "12:00" }, { day: "wednesday", from: "13:00", to: "17:00" }],
    maxMentees: 3,
    sessionPref: "in_person" as const,
    rating: 45,
    totalRatings: 7,
  },
  {
    name: "أ. روان بنت فيصل الحسيني",
    nameEn: "Rawan Al-Husseini",
    email: "rawan.husseini@goid.gov.sa",
    department: "الشؤون القانونية",
    jobTitle: "رئيسة قسم الامتثال",
    jobTitleEn: "Compliance Section Head",
    years: 11,
    areas: ["compliance", "governance"],
    skills: ["policy_development", "risk_management", "communication", "negotiation"],
    motivation: "الامتثال المؤسسي يحمي المنظمة ويضمن استمراريتها. أريد مساعدة الزملاء على فهم المتطلبات التنظيمية وتطبيقها بصورة عملية.",
    motivationEn: "Institutional compliance protects organizations and ensures continuity. I want to help colleagues understand and practically apply regulatory requirements.",
    availability: [{ day: "monday", from: "10:00", to: "14:00" }, { day: "thursday", from: "10:00", to: "14:00" }],
    maxMentees: 3,
    sessionPref: "both" as const,
    rating: 42,
    totalRatings: 5,
  },
  // Strategy (3)
  {
    name: "د. عبدالرحمن بن سعيد القرشي",
    nameEn: "Dr. Abdulrahman Al-Qurashi",
    email: "abdulrahman.qurashi@goid.gov.sa",
    department: "التخطيط والاستراتيجية",
    jobTitle: "مدير التخطيط الاستراتيجي",
    jobTitleEn: "Strategic Planning Director",
    years: 25,
    areas: ["strategic_planning", "change_management"],
    skills: ["strategic_planning", "change_management", "leadership", "communication"],
    motivation: "بعد 25 عاماً في مجال التخطيط والاستراتيجية، أشعر بمسؤولية كبيرة لنقل ما تعلمته للجيل القادم من القادة.",
    motivationEn: "After 25 years in planning and strategy, I feel a great responsibility to pass on what I've learned to the next generation of leaders.",
    availability: [{ day: "sunday", from: "10:00", to: "14:00" }, { day: "tuesday", from: "10:00", to: "14:00" }, { day: "thursday", from: "10:00", to: "14:00" }],
    maxMentees: 5,
    sessionPref: "both" as const,
    rating: 50,
    totalRatings: 18,
  },
  {
    name: "أ. شيماء بنت عادل الجهني",
    nameEn: "Shaimaa Al-Juhani",
    email: "shaimaa.juhani@goid.gov.sa",
    department: "التخطيط والاستراتيجية",
    jobTitle: "مديرة إدارة التغيير",
    jobTitleEn: "Change Management Manager",
    years: 13,
    areas: ["change_management", "strategic_planning"],
    skills: ["change_management", "communication", "leadership", "problem_solving"],
    motivation: "إدارة التغيير فن يتطلب فهماً عميقاً للإنسان والمؤسسة. أريد مساعدة الزملاء على قيادة التحولات بأقل مقاومة وأعلى كفاءة.",
    motivationEn: "Change management is an art requiring deep understanding of people and organizations. I want to help colleagues lead transformations with minimum resistance.",
    availability: [{ day: "monday", from: "13:00", to: "17:00" }, { day: "wednesday", from: "09:00", to: "13:00" }],
    maxMentees: 4,
    sessionPref: "both" as const,
    rating: 47,
    totalRatings: 10,
  },
  {
    name: "أ. تركي بن ناصر العنزي",
    nameEn: "Turki Al-Anazi",
    email: "turki.anazi@goid.gov.sa",
    department: "التخطيط والاستراتيجية",
    jobTitle: "مدير تطوير الأعمال",
    jobTitleEn: "Business Development Manager",
    years: 14,
    areas: ["business_development", "strategic_planning"],
    skills: ["business_development", "negotiation", "strategic_planning", "communication"],
    motivation: "تطوير الأعمال في القطاع الحكومي له خصوصية فريدة. أريد مساعدة الزملاء على فهم كيفية بناء الشراكات وتطوير المبادرات الاستراتيجية.",
    motivationEn: "Business development in the government sector has unique characteristics. I want to help colleagues build partnerships and develop strategic initiatives.",
    availability: [{ day: "tuesday", from: "09:00", to: "13:00" }, { day: "thursday", from: "09:00", to: "13:00" }],
    maxMentees: 3,
    sessionPref: "virtual" as const,
    rating: 44,
    totalRatings: 7,
  },
  // Customer Service (2)
  {
    name: "أ. هند بنت منصور الرشيدي",
    nameEn: "Hind Al-Rashidi",
    email: "hind.rashidi@goid.gov.sa",
    department: "خدمة العملاء",
    jobTitle: "مديرة تجربة العميل",
    jobTitleEn: "Customer Experience Manager",
    years: 10,
    areas: ["customer_experience"],
    skills: ["communication", "problem_solving", "change_management", "leadership"],
    motivation: "تجربة العميل هي محور كل خدمة حكومية ناجحة. أريد مساعدة الزملاء على تبني نهج يضع المستفيد في مركز كل قرار.",
    motivationEn: "Customer experience is the core of every successful government service. I want to help colleagues adopt an approach centered on the beneficiary.",
    availability: [{ day: "sunday", from: "13:00", to: "17:00" }, { day: "thursday", from: "13:00", to: "17:00" }],
    maxMentees: 3,
    sessionPref: "both" as const,
    rating: 46,
    totalRatings: 8,
  },
  {
    name: "أ. وليد بن عمر البقمي",
    nameEn: "Walid Al-Baqami",
    email: "walid.baqami@goid.gov.sa",
    department: "خدمة العملاء",
    jobTitle: "مدير إدارة الشكاوى",
    jobTitleEn: "Complaints Management Manager",
    years: 8,
    areas: ["complaints_management", "customer_experience"],
    skills: ["communication", "negotiation", "problem_solving", "data_analysis"],
    motivation: "الشكوى فرصة للتحسين. أريد مساعدة فرق الخدمة على تحويل الشكاوى لنقاط تحسين حقيقية تُعزز رضا المستفيدين.",
    motivationEn: "A complaint is an opportunity for improvement. I want to help service teams convert complaints into real improvement points.",
    availability: [{ day: "monday", from: "08:00", to: "12:00" }, { day: "wednesday", from: "08:00", to: "12:00" }],
    maxMentees: 3,
    sessionPref: "in_person" as const,
    rating: 43,
    totalRatings: 5,
  },
];

// ===== 30 MENTEES =====
const MENTEES_DATA = [
  { name: "بدر بن محمد العسيري", email: "badr.aseeri@goid.gov.sa", dept: "التخطيط والاستراتيجية", title: "محلل استراتيجي", years: 3, area: "strategic_planning", skills: ["strategic_planning", "data_analysis"] },
  { name: "سمر بنت علي الشريف", email: "samar.sharif@goid.gov.sa", dept: "الموارد البشرية", title: "أخصائية تدريب", years: 4, area: "talent_development", skills: ["talent_development", "communication"] },
  { name: "أيمن بن خالد الحمدان", email: "ayman.hamdan@goid.gov.sa", dept: "تقنية المعلومات", title: "مهندس شبكات", years: 5, area: "cybersecurity", skills: ["cybersecurity", "risk_management"] },
  { name: "دلال بنت عبدالله المنصور", email: "dalal.mansour@goid.gov.sa", dept: "المالية", title: "محاسبة", years: 3, area: "financial_analysis", skills: ["financial_analysis", "data_analysis"] },
  { name: "ياسر بن سعد الفهيد", email: "yaser.fahid@goid.gov.sa", dept: "العمليات", title: "مشرف عمليات", years: 6, area: "project_management", skills: ["project_management", "leadership"] },
  { name: "ريهام بنت فهد الزيد", email: "riham.zaid@goid.gov.sa", dept: "التسويق والاتصال", title: "أخصائية اتصال", years: 4, area: "corporate_communication", skills: ["communication", "change_management"] },
  { name: "حسن بن عبدالعزيز الصالح", email: "hassan.saleh@goid.gov.sa", dept: "الشؤون القانونية", title: "مستشار قانوني", years: 5, area: "governance", skills: ["governance", "policy_development"] },
  { name: "منال بنت ناصر القريشي", email: "manal.qurashi@goid.gov.sa", dept: "الموارد البشرية", title: "أخصائية توظيف", years: 3, area: "workforce_planning", skills: ["workforce_planning", "communication"] },
  { name: "زياد بن محمد الغامدي", email: "ziad.ghamdi@goid.gov.sa", dept: "تقنية المعلومات", title: "مطور أنظمة", years: 4, area: "digital_transformation", skills: ["digital_transformation", "problem_solving"] },
  { name: "أريج بنت سلمان الحازمي", email: "arij.hazmi@goid.gov.sa", dept: "خدمة العملاء", title: "أخصائية خدمة عملاء", years: 2, area: "customer_experience", skills: ["communication", "problem_solving"] },
  { name: "عمار بن عبدالله السهلي", email: "ammar.sahli@goid.gov.sa", dept: "العمليات", title: "مدير مشروع", years: 7, area: "process_improvement", skills: ["project_management", "change_management"] },
  { name: "لينا بنت أحمد الجبير", email: "lina.jubair@goid.gov.sa", dept: "المالية", title: "محللة ميزانية", years: 5, area: "budget_management", skills: ["budget_management", "data_analysis"] },
  { name: "ماجد بن فيصل الراشد", email: "majid.rashid@goid.gov.sa", dept: "التخطيط والاستراتيجية", title: "مخطط استراتيجي", years: 6, area: "change_management", skills: ["change_management", "leadership"] },
  { name: "نادية بنت عمر الزهراني", email: "nadia.zahrani@goid.gov.sa", dept: "الموارد البشرية", title: "مديرة شؤون موظفين", years: 8, area: "performance_management", skills: ["performance_management", "leadership"] },
  { name: "طارق بن حمود المطرودي", email: "tariq.matrodi@goid.gov.sa", dept: "تقنية المعلومات", title: "محلل أمن معلومات", years: 3, area: "cybersecurity", skills: ["cybersecurity", "risk_management"] },
  { name: "وفاء بنت محمد العمري", email: "wafa.omari@goid.gov.sa", dept: "التسويق والاتصال", title: "مديرة تسويق رقمي", years: 5, area: "brand_management", skills: ["communication", "change_management"] },
  { name: "يحيى بن عبدالرحمن الهلال", email: "yahya.hilal@goid.gov.sa", dept: "الشؤون القانونية", title: "مستشار امتثال", years: 4, area: "compliance", skills: ["policy_development", "risk_management"] },
  { name: "رشا بنت سعيد البلوي", email: "rasha.balawi@goid.gov.sa", dept: "العمليات", title: "محللة عمليات", years: 3, area: "project_management", skills: ["project_management", "data_analysis"] },
  { name: "سامي بن علي الصاعدي", email: "sami.saadi@goid.gov.sa", dept: "المالية", title: "مراجع داخلي", years: 6, area: "financial_analysis", skills: ["financial_analysis", "risk_management"] },
  { name: "هنادي بنت خالد الحربي", email: "hanadi.harbi@goid.gov.sa", dept: "خدمة العملاء", title: "مشرفة شكاوى", years: 4, area: "complaints_management", skills: ["communication", "problem_solving"] },
  { name: "فارس بن عبدالله الشهري", email: "fares.shahri@goid.gov.sa", dept: "التخطيط والاستراتيجية", title: "باحث استراتيجي", years: 4, area: "business_development", skills: ["business_development", "strategic_planning"] },
  { name: "نجلاء بنت حمزة السلمي", email: "najla.salmi@goid.gov.sa", dept: "الموارد البشرية", title: "أخصائية تطوير مهني", years: 5, area: "talent_development", skills: ["talent_development", "leadership"] },
  { name: "معن بن ناصر الأسمري", email: "maan.asmari@goid.gov.sa", dept: "تقنية المعلومات", title: "مدير تحول رقمي", years: 9, area: "digital_transformation", skills: ["digital_transformation", "change_management"] },
  { name: "غدير بنت أحمد القحطاني", email: "ghadir.qahtani@goid.gov.sa", dept: "المالية", title: "رئيسة قسم مالي", years: 7, area: "budget_management", skills: ["budget_management", "leadership"] },
  { name: "يوسف بن إبراهيم العمير", email: "yusuf.omair@goid.gov.sa", dept: "العمليات", title: "مدير لوجستيات", years: 8, area: "process_improvement", skills: ["project_management", "problem_solving"] },
  { name: "صفاء بنت وليد الحمادي", email: "safa.hammadi@goid.gov.sa", dept: "التسويق والاتصال", title: "مديرة علاقات عامة", years: 6, area: "corporate_communication", skills: ["communication", "negotiation"] },
  { name: "نايف بن سلطان المقبل", email: "naif.maqbool@goid.gov.sa", dept: "الشؤون القانونية", title: "رئيس قسم حوكمة", years: 10, area: "governance", skills: ["governance", "policy_development"] },
  { name: "أسماء بنت رعد العنزي", email: "asma.anazi@goid.gov.sa", dept: "خدمة العملاء", title: "مديرة رضا العملاء", years: 5, area: "customer_experience", skills: ["communication", "data_analysis"] },
  { name: "عادل بن فهد الشريان", email: "adel.shariyan@goid.gov.sa", dept: "التخطيط والاستراتيجية", title: "مخطط مؤسسي", years: 5, area: "strategic_planning", skills: ["strategic_planning", "change_management"] },
  { name: "ثريا بنت محمود الحمود", email: "thuraya.hamoud@goid.gov.sa", dept: "الموارد البشرية", title: "أخصائية أداء", years: 4, area: "performance_management", skills: ["performance_management", "communication"] },
];

// ===== 50 EMPLOYEES =====
const EMPLOYEES_DATA = [
  { name: "عبدالله بن راشد المطيري", email: "e001@goid.gov.sa", dept: "تقنية المعلومات", title: "فني دعم تقني", years: 2 },
  { name: "أميرة بنت سعد الدغيثر", email: "e002@goid.gov.sa", dept: "الموارد البشرية", title: "موظفة شؤون موظفين", years: 3 },
  { name: "جاسم بن علي الهاجري", email: "e003@goid.gov.sa", dept: "المالية", title: "محاسب", years: 4 },
  { name: "منيرة بنت ناصر الرويلي", email: "e004@goid.gov.sa", dept: "التسويق والاتصال", title: "أخصائية محتوى", years: 2 },
  { name: "راشد بن عبدالله الحميدي", email: "e005@goid.gov.sa", dept: "العمليات", title: "موظف عمليات", years: 3 },
  { name: "حنان بنت فهد السلمي", email: "e006@goid.gov.sa", dept: "الشؤون القانونية", title: "مساعد قانوني", years: 2 },
  { name: "أنس بن محمد الشايع", email: "e007@goid.gov.sa", dept: "التخطيط والاستراتيجية", title: "موظف تخطيط", years: 3 },
  { name: "بشير بنت سلمان الدوسري", email: "e008@goid.gov.sa", dept: "خدمة العملاء", title: "موظف خدمة عملاء", years: 2 },
  { name: "وضحى بنت خالد الغامدي", email: "e009@goid.gov.sa", dept: "تقنية المعلومات", title: "أخصائية بيانات", years: 4 },
  { name: "حمد بن نايف المالكي", email: "e010@goid.gov.sa", dept: "الموارد البشرية", title: "مساعد موارد بشرية", years: 2 },
  { name: "مضاوي بنت عمر الزهراني", email: "e011@goid.gov.sa", dept: "المالية", title: "محللة مالية مبتدئة", years: 3 },
  { name: "عمر بن فيصل النمر", email: "e012@goid.gov.sa", dept: "التسويق والاتصال", title: "مصمم جرافيك", years: 2 },
  { name: "نجود بنت عبدالرحمن الصغير", email: "e013@goid.gov.sa", dept: "العمليات", title: "مساعدة مشاريع", years: 3 },
  { name: "سعود بن محمد المطرفي", email: "e014@goid.gov.sa", dept: "الشؤون القانونية", title: "باحث قانوني", years: 4 },
  { name: "أروى بنت سعيد المنصور", email: "e015@goid.gov.sa", dept: "التخطيط والاستراتيجية", title: "باحثة", years: 2 },
  { name: "صالح بن عبدالعزيز الدوسري", email: "e016@goid.gov.sa", dept: "خدمة العملاء", title: "ممثل خدمة عملاء", years: 3 },
  { name: "شروق بنت خليل العتيبي", email: "e017@goid.gov.sa", dept: "تقنية المعلومات", title: "مبرمج", years: 4 },
  { name: "نادر بن صالح الحمادي", email: "e018@goid.gov.sa", dept: "الموارد البشرية", title: "محلل تدريب", years: 3 },
  { name: "خلود بنت محمد العتيبي", email: "e019@goid.gov.sa", dept: "المالية", title: "مراقبة ميزانية", years: 5 },
  { name: "مشعل بن فهد المطيري", email: "e020@goid.gov.sa", dept: "التسويق والاتصال", title: "كاتب محتوى", years: 2 },
  { name: "نوف بنت عادل الشهراني", email: "e021@goid.gov.sa", dept: "العمليات", title: "مسؤولة جودة", years: 4 },
  { name: "علي بن محمد الزهراني", email: "e022@goid.gov.sa", dept: "الشؤون القانونية", title: "أخصائي عقود", years: 3 },
  { name: "رهف بنت أحمد العمري", email: "e023@goid.gov.sa", dept: "التخطيط والاستراتيجية", title: "محللة أداء", years: 4 },
  { name: "إبراهيم بن ناصر الحربي", email: "e024@goid.gov.sa", dept: "خدمة العملاء", title: "رئيس فريق خدمة", years: 5 },
  { name: "ضحى بنت خالد الشمري", email: "e025@goid.gov.sa", dept: "تقنية المعلومات", title: "محللة نظم", years: 3 },
  { name: "سليمان بن علي القحطاني", email: "e026@goid.gov.sa", dept: "الموارد البشرية", title: "مساعد تطوير تنظيمي", years: 2 },
  { name: "بيان بنت فهد النعمي", email: "e027@goid.gov.sa", dept: "المالية", title: "أخصائية مشتريات", years: 3 },
  { name: "أمير بن سعد الغامدي", email: "e028@goid.gov.sa", dept: "التسويق والاتصال", title: "مدير وسائل التواصل", years: 4 },
  { name: "حوراء بنت محمد العسيري", email: "e029@goid.gov.sa", dept: "العمليات", title: "مراقب عمليات", years: 3 },
  { name: "عبدالمجيد بن فيصل السهلي", email: "e030@goid.gov.sa", dept: "الشؤون القانونية", title: "أخصائي امتثال", years: 4 },
  { name: "شيخة بنت ناصر الرشيدي", email: "e031@goid.gov.sa", dept: "التخطيط والاستراتيجية", title: "أخصائية تخطيط", years: 3 },
  { name: "عزيز بن راشد المرواني", email: "e032@goid.gov.sa", dept: "خدمة العملاء", title: "أخصائي تحسين خدمة", years: 4 },
  { name: "تهاني بنت عمر الطيار", email: "e033@goid.gov.sa", dept: "تقنية المعلومات", title: "مديرة مشاريع تقنية", years: 7 },
  { name: "فراس بن محمد الحسن", email: "e034@goid.gov.sa", dept: "الموارد البشرية", title: "رئيس قسم توظيف", years: 6 },
  { name: "لولوة بنت صالح الجبر", email: "e035@goid.gov.sa", dept: "المالية", title: "رئيسة قسم مالي", years: 7 },
  { name: "عبدالملك بن خالد المطيري", email: "e036@goid.gov.sa", dept: "التسويق والاتصال", title: "مدير تسويق", years: 8 },
  { name: "غزالة بنت نايف القريني", email: "e037@goid.gov.sa", dept: "العمليات", title: "مشرفة عمليات", years: 5 },
  { name: "حمود بن عبدالله الفهيد", email: "e038@goid.gov.sa", dept: "الشؤون القانونية", title: "رئيس قسم قانوني", years: 8 },
  { name: "غنى بنت سعيد الزيد", email: "e039@goid.gov.sa", dept: "التخطيط والاستراتيجية", title: "محللة استراتيجية", years: 6 },
  { name: "طلال بن فهد المطرودي", email: "e040@goid.gov.sa", dept: "خدمة العملاء", title: "مدير قسم خدمة", years: 9 },
  { name: "ميسم بنت محمد الزبيدي", email: "e041@goid.gov.sa", dept: "تقنية المعلومات", title: "مديرة أمن بيانات", years: 8 },
  { name: "سفيان بن صالح الزهراني", email: "e042@goid.gov.sa", dept: "الموارد البشرية", title: "مدير موارد بشرية", years: 9 },
  { name: "روضة بنت علي المنصور", email: "e043@goid.gov.sa", dept: "المالية", title: "رئيسة قسم ميزانيات", years: 10 },
  { name: "بكر بن ناصر الشايع", email: "e044@goid.gov.sa", dept: "التسويق والاتصال", title: "مدير اتصال مؤسسي", years: 7 },
  { name: "إيمان بنت فيصل الدوسري", email: "e045@goid.gov.sa", dept: "العمليات", title: "مديرة تحسين عمليات", years: 8 },
  { name: "محمود بن إبراهيم الحامد", email: "e046@goid.gov.sa", dept: "الشؤون القانونية", title: "مدير شؤون قانونية", years: 11 },
  { name: "جميلة بنت خالد الربيعي", email: "e047@goid.gov.sa", dept: "التخطيط والاستراتيجية", title: "مستشارة استراتيجية", years: 10 },
  { name: "خليل بن عادل المزروع", email: "e048@goid.gov.sa", dept: "خدمة العملاء", title: "مدير تجربة العملاء", years: 7 },
  { name: "أميمة بنت محمد المعيوف", email: "e049@goid.gov.sa", dept: "تقنية المعلومات", title: "مديرة تقنية المعلومات", years: 12 },
  { name: "عبدالكريم بن سعد الحازمي", email: "e050@goid.gov.sa", dept: "الموارد البشرية", title: "مدير تطوير مؤسسي", years: 11 },
];

async function main() {
  console.log("🌱 Starting seed...");
  const passwordHash = await bcrypt.hash("Rawafid@2024", 10);

  // ===== 1. Create Tenant =====
  console.log("Creating tenant...");
  await db.insert(schema.tenants).values({
    id: TENANT_ID,
    name: "الهيئة العامة للتطوير المؤسسي",
    nameEn: "General Organization Development Authority",
    slug: "goid",
    settings: {
      maxMenteesPerMentor: 5,
      allowSameDepartmentMatch: false,
      matchingWeights: { domain: 0.30, skills: 0.25, experience: 0.20, availability: 0.15, rating: 0.10 },
    },
    isActive: true,
  });

  // ===== 2. Create Admin User =====
  console.log("Creating admin...");
  const adminId = nanoid();
  await db.insert(schema.users).values({
    id: adminId,
    tenantId: TENANT_ID,
    email: "admin@rawafid.pro",
    name: "مسؤول روافد",
    nameEn: "Rawafid Admin",
    role: "org_admin",
    department: "الإدارة العامة",
    jobTitle: "مسؤول التدريب والتطوير",
    yearsOfExperience: 10,
    passwordHash,
    status: "active",
    language: "ar",
  });

  // ===== 3. Create Mentors =====
  console.log("Creating 20 mentors...");
  const mentorUserIds: string[] = [];
  const mentorProfileIds: string[] = [];

  for (const m of MENTORS_DATA) {
    const userId = nanoid();
    const profileId = nanoid();
    mentorUserIds.push(userId);
    mentorProfileIds.push(profileId);

    await db.insert(schema.users).values({
      id: userId,
      tenantId: TENANT_ID,
      email: m.email,
      name: m.name,
      nameEn: m.nameEn,
      role: "mentor",
      department: m.department,
      jobTitle: m.jobTitle,
      jobTitleEn: m.jobTitleEn,
      yearsOfExperience: m.years,
      passwordHash,
      status: "active",
      language: "ar",
    });

    const areaItems = m.areas.map((aid) => EXPERTISE_AREAS.find((a) => a.id === aid)!).filter(Boolean);
    const skillItems = m.skills.map((sid) => SKILLS.find((s) => s.id === sid)!).filter(Boolean);

    await db.insert(schema.mentorProfiles).values({
      id: profileId,
      userId,
      tenantId: TENANT_ID,
      areasOfExpertise: areaItems,
      skills: skillItems,
      availability: m.availability,
      maxMentees: m.maxMentees,
      sessionPreference: m.sessionPref,
      motivation: m.motivation,
      motivationEn: m.motivationEn,
      status: "approved",
      approvedBy: adminId,
      approvedAt: new Date(),
      averageRating: m.rating / 10,
      totalRatings: m.totalRatings,
    });
  }

  // ===== 4. Create Mentees =====
  console.log("Creating 30 mentees...");
  const menteeUserIds: string[] = [];
  const menteeRequestIds: string[] = [];

  for (const m of MENTEES_DATA) {
    const userId = nanoid();
    const requestId = nanoid();
    menteeUserIds.push(userId);
    menteeRequestIds.push(requestId);

    await db.insert(schema.users).values({
      id: userId,
      tenantId: TENANT_ID,
      email: m.email,
      name: m.name,
      role: "mentee",
      department: m.dept,
      jobTitle: m.title,
      yearsOfExperience: m.years,
      passwordHash,
      status: "active",
      language: "ar",
    });

    await db.insert(schema.menteeRequests).values({
      id: requestId,
      userId,
      tenantId: TENANT_ID,
      desiredArea: m.area,
      desiredSkills: m.skills,
      description: `أسعى لتطوير مهاراتي في مجال ${m.area} لتعزيز أدائي المهني وتحقيق أهدافي الوظيفية.`,
      goals: "اكتساب معارف عملية وتطوير مهارات قابلة للتطبيق الفوري في بيئة العمل.",
      sessionPreference: "both",
      status: "open",
    });
  }

  // ===== 5. Create Regular Employees =====
  console.log("Creating 50 employees...");
  const employeeUserIds: string[] = [];

  for (const e of EMPLOYEES_DATA) {
    const userId = nanoid();
    employeeUserIds.push(userId);

    await db.insert(schema.users).values({
      id: userId,
      tenantId: TENANT_ID,
      email: e.email,
      name: e.name,
      role: "employee",
      department: e.dept,
      jobTitle: e.title,
      yearsOfExperience: e.years,
      passwordHash,
      status: "active",
      language: "ar",
    });
  }

  // ===== 6. Create 5 Active Matches =====
  console.log("Creating 5 active matches...");
  const matchIds: string[] = [];
  const matchPairs = [
    { mentorIdx: 0, menteeIdx: 0, score: 87 },  // Khalid (digital) → Badr (strategy)
    { mentorIdx: 4, menteeIdx: 1, score: 92 },  // Noura HR → Samar (talent)
    { mentorIdx: 7, menteeIdx: 3, score: 85 },  // Mohammed Finance → Dalal (finance)
    { mentorIdx: 11, menteeIdx: 4, score: 88 }, // Fahad Ops → Yaser (PM)
    { mentorIdx: 15, menteeIdx: 2, score: 79 }, // Dr. Abdulrahman Strategy → Ayman (IT)
  ];

  for (const pair of matchPairs) {
    const matchId = nanoid();
    matchIds.push(matchId);

    await db.insert(schema.matches).values({
      id: matchId,
      tenantId: TENANT_ID,
      mentorId: mentorUserIds[pair.mentorIdx],
      menteeId: menteeUserIds[pair.menteeIdx],
      requestId: menteeRequestIds[pair.menteeIdx],
      matchingScore: pair.score,
      status: "active",
    });

    // Update mentee request to matched
    await db.update(schema.menteeRequests)
      .set({ status: "matched", updatedAt: new Date() })
      .where(eq(schema.menteeRequests.id, menteeRequestIds[pair.menteeIdx]));
  }

  // ===== 7. Create 10 Completed Sessions + 3 Scheduled =====
  console.log("Creating sessions...");
  const pastDates = [
    new Date("2026-01-15T10:00:00"),
    new Date("2026-01-22T10:00:00"),
    new Date("2026-02-05T10:00:00"),
    new Date("2026-02-12T10:00:00"),
    new Date("2026-02-19T10:00:00"),
    new Date("2026-03-05T10:00:00"),
    new Date("2026-03-12T10:00:00"),
    new Date("2026-03-19T10:00:00"),
    new Date("2026-03-20T10:00:00"),
    new Date("2026-03-25T10:00:00"),
  ];

  const completedSessionIds: string[] = [];

  for (let i = 0; i < 10; i++) {
    const sessionId = nanoid();
    const matchIdx = i % 5;
    completedSessionIds.push(sessionId);

    await db.insert(schema.sessions).values({
      id: sessionId,
      matchId: matchIds[matchIdx],
      tenantId: TENANT_ID,
      type: i % 2 === 0 ? "virtual" : "in_person",
      locationOrLink: i % 2 === 0 ? "https://teams.microsoft.com/meeting/rawafid" : "غرفة الاجتماعات A-201",
      scheduledAt: pastDates[i],
      durationMinutes: 60,
      status: "completed",
    });

    // Session summary
    await db.insert(schema.sessionSummaries).values({
      id: nanoid(),
      sessionId,
      tenantId: TENANT_ID,
      authorId: mentorUserIds[matchPairs[matchIdx].mentorIdx],
      discussedPoints: "مناقشة التحديات الحالية وتحديد الأهداف القصيرة المدى",
      decisions: "العمل على مشروع تطبيقي خلال الشهر القادم",
      actionItems: "قراءة الموارد المحددة وإعداد خطة العمل",
    });

    // Reviews (both ways)
    await db.insert(schema.sessionReviews).values({
      id: nanoid(),
      sessionId,
      tenantId: TENANT_ID,
      reviewerId: menteeUserIds[matchPairs[matchIdx].menteeIdx],
      revieweeId: mentorUserIds[matchPairs[matchIdx].mentorIdx],
      overallRating: 4 + (i % 2),
      ratingBenefit: 4 + (i % 2),
      ratingPreparation: 4,
      ratingPunctuality: 5,
      ratingCommunication: 4 + (i % 2),
      comments: "جلسة مفيدة جداً، شعرت بتقدم ملموس في فهم الموضوع",
    });
  }

  // 3 Upcoming sessions
  const futureDates = [
    new Date("2026-04-02T10:00:00"),
    new Date("2026-04-09T10:00:00"),
    new Date("2026-04-16T10:00:00"),
  ];

  for (let i = 0; i < 3; i++) {
    await db.insert(schema.sessions).values({
      id: nanoid(),
      matchId: matchIds[i],
      tenantId: TENANT_ID,
      type: "virtual",
      locationOrLink: "https://teams.microsoft.com/meeting/rawafid",
      scheduledAt: futureDates[i],
      durationMinutes: 60,
      status: "scheduled",
    });
  }

  // ===== 8. Create 3 Development Plans =====
  console.log("Creating development plans...");
  for (let i = 0; i < 3; i++) {
    const planId = nanoid();

    await db.insert(schema.developmentPlans).values({
      id: planId,
      matchId: matchIds[i],
      tenantId: TENANT_ID,
    });

    // 2-3 goals per plan
    const goalData = [
      { title: "تطوير مهارات القيادة", status: "in_progress" as const },
      { title: "إتقان أدوات التحليل المتقدم", status: "not_started" as const },
      { title: "بناء شبكة علاقات مهنية", status: "in_progress" as const },
    ];

    for (const g of goalData.slice(0, i + 2)) {
      const goalId = nanoid();
      await db.insert(schema.developmentGoals).values({
        id: goalId,
        planId,
        tenantId: TENANT_ID,
        title: g.title,
        status: g.status,
        targetDate: new Date("2026-12-31"),
      });

      await db.insert(schema.goalMilestones).values({
        id: nanoid(),
        goalId,
        tenantId: TENANT_ID,
        title: "إتمام قراءة الموارد الأساسية",
        status: "completed",
      });

      await db.insert(schema.goalMilestones).values({
        id: nanoid(),
        goalId,
        tenantId: TENANT_ID,
        title: "تطبيق المفاهيم على مشروع حقيقي",
        status: "in_progress",
      });
    }
  }

  console.log("✅ Seed completed successfully!");
  console.log(`
  📊 Created:
  - 1 Tenant: الهيئة العامة للتطوير المؤسسي (slug: goid)
  - 1 Admin: admin@rawafid.pro (password: Rawafid@2024)
  - 20 Mentors (all approved)
  - 30 Mentees (with open requests)
  - 50 Employees
  - 5 Active Matches
  - 10 Completed Sessions + 3 Scheduled
  - 3 Development Plans
  `);
}

main().catch(console.error);
