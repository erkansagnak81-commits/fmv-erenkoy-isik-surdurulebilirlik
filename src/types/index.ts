export type UserRole = 'teacher' | 'dept_head' | 'coordinator' | 'principal' | 'admin';

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
  isAcademic?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  title: string;
  avatar?: string;
  createdAt?: string;
  status?: 'active' | 'pending';
  customPermissions?: Partial<RoleActionPermissions>;
  isCasCoordinator?: boolean;
}

export interface SdgGoal {
  number: number;
  name: string;
  shortName: string;
  color: string;
  iconName: string;
  description: string;
}

export interface ImpactOutputItem {
  id: string;
  description: string;
  value: number;
  unit: string;
}

export interface ImpactMediaFile {
  id: string;
  name: string;
  type: 'image' | 'video';
  url: string;
  size?: number;
}

export interface ImpactReport {
  id: string;
  projectId: string;
  actualParticipants: number;
  studentParticipants?: number;
  teacherParticipants?: number;
  impactOutputs?: ImpactOutputItem[];
  impactMetricValue?: number;
  impactMetricUnit?: string;
  evaluationNotes?: string;
  photoUrls?: string[];
  mediaFiles?: ImpactMediaFile[];
  driveFolderUrl?: string;
  completedAt: string;
}

export interface ProjectEvent {
  id: string;
  title: string;
  description: string;
  departmentId: string;
  advisorId: string;
  advisorName: string;
  collaboratingTeachers?: string[];
  studentClub?: string;
  studentRepresentatives?: string[];
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
  // Kayıt & Güncelleme Bilgisi (Audit Trail)
  createdByName?: string;
  createdByEmail?: string;
  createdAt?: string;
  updatedByName?: string;
  updatedByEmail?: string;
  updatedAt?: string;
}

export interface AcademicYear {
  id: string; // Örn: "2026-2027"
  name: string; // Örn: "2026-2027 Eğitim-Öğretim Yılı"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isActive: boolean;
  totalStudents?: number; // Koordinatör tarafından girilen okul öğrenci mevcudu
  description?: string;
}

// Uygulama Menü Sekmeleri
export type AppTab = 
  | 'dashboard' 
  | 'calendar' 
  | 'projects' 
  | 'approvals' 
  | 'curriculum' 
  | 'campus' 
  | 'reports' 
  | 'users'
  | 'logs';

// Sistem ve Kullanıcı Aktivite Günlüğü (Audit Trail)
export type LogCategory = 'auth' | 'project' | 'projects' | 'curriculum' | 'metrics' | 'system';

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  departmentId?: string;
  actionType: 
    | 'login' 
    | 'logout' 
    | 'heartbeat' 
    | 'session_end'
    | 'create_project' 
    | 'submit_project'
    | 'update_project' 
    | 'approve_project'
    | 'delete_project' 
    | 'submit_impact_report' 
    | 'create_curriculum' 
    | 'update_curriculum' 
    | 'delete_curriculum' 
    | 'create_metric' 
    | 'update_metric' 
    | 'delete_metric' 
    | 'clear_metrics'
    | 'create_user' 
    | 'update_user' 
    | 'delete_user' 
    | 'update_permissions'
    | 'update_academic_year'
    | 'change_active_year'
    | 'clear_logs'
    | 'system_action'
    | string;
  category: LogCategory;
  description: string;
  details?: Record<string, any>;
  timestamp: string; // ISO 8601
  sessionDurationSeconds?: number; // Oturum süresi
}

// Eylem ve İşlem Düzeyi Yetkiler
export interface RoleActionPermissions {
  // Proje & Faaliyetler
  canCreateProject: boolean;
  canEditOwnProject: boolean;
  canEditDeptProject: boolean;
  canEditAllProjects: boolean;
  canDeleteProject: boolean;
  canApproveDept: boolean;
  canApproveCoordinator: boolean;
  canSubmitReport: boolean;
  canExportProjects: boolean;

  // Müfredat & SKA
  canCreateCurriculum: boolean;
  canEditOwnCurriculum: boolean;
  canEditAllCurriculum: boolean;
  canExportCurriculum: boolean;

  // Yeşil Kampüs Metrikleri
  canEditCampusMetrics: boolean;
  canResetCampusMetrics: boolean;

  // Sistem & Yönetim
  canManageUsers: boolean;
  canManageAcademicYears: boolean;
}

// Rol Bazlı Yetki Yapılandırması
export interface RolePermissionConfig {
  role: UserRole;
  roleName: string;
  description: string;
  allowedTabs: AppTab[];
  permissions: RoleActionPermissions;
  assignedUsers?: Partial<Record<keyof RoleActionPermissions, string[]>>;
}

// Tüm Roller İçin Yetki Matrisi
export type SystemRolePermissions = Record<UserRole, RolePermissionConfig>;

