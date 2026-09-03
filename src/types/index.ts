export type UserRole = 'teacher' | 'dept_head' | 'coordinator';

export type ProjectStatus = 
  | 'draft' 
  | 'submitted' 
  | 'dept_approved' 
  | 'coordinator_approved' 
  | 'revision_needed' 
  | 'completed';

export interface Department {
  id: string;
  name: string;
  code: string;
  color: string;
  headName: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId: string;
  title: string;
  avatar?: string;
}

export interface SdgGoal {
  number: number;
  name: string;
  shortName: string;
  color: string;
  iconName: string;
  description: string;
}

export interface ImpactReport {
  id: string;
  projectId: string;
  actualParticipants: number;
  impactMetricValue?: number;
  impactMetricUnit?: string;
  evaluationNotes?: string;
  photoUrls?: string[];
  completedAt: string;
}

export interface ProjectEvent {
  id: string;
  title: string;
  description: string;
  departmentId: string;
  advisorId: string;
  advisorName: string;
  eventType: 'Atölye' | 'Seminer / Konferans' | 'Saha Gezisi' | 'Farkındalık Kampanyası' | 'Yarışma' | 'Müfredat İçi Proje';
  sdgGoals: number[];
  targetGrades: string[];
  startDate: string;
  endDate?: string;
  location: string;
  resourceNeeds?: string;
  status: ProjectStatus;
  rejectionFeedback?: string;
  createdAt: string;
  impactReport?: ImpactReport;
}

export interface CurriculumIntegration {
  id: string;
  departmentId: string;
  teacherName: string;
  courseName: string;
  gradeLevel: string;
  learningOutcome: string;
  sdgGoals: number[];
  activityDescription: string;
  studentCount: number;
  academicTerm: string;
}

export interface CampusMetric {
  id: string;
  period: string; // YYYY-MM
  electricityKwh: number;
  waterM3: number;
  paperReams: number;
  recyclingPaperKg: number;
  recyclingPlasticKg: number;
  recyclingGlassKg: number;
  recyclingMetalKg: number;
  compostOrganicKg: number;
  specialEwasteKg: number;
  notes?: string;
}
