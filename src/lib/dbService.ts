import { supabase, isSupabaseConfigured } from './supabase';
import { ProjectEvent, CurriculumIntegration, CampusMetric, ProjectStatus, ImpactReport } from '../types';
import { INITIAL_PROJECTS, INITIAL_CURRICULUM, INITIAL_CAMPUS_METRICS, DEPARTMENTS } from '../data/mockData';

// Bölüm kodunu Supabase UUID'sine eşleştiren yardımcı önbellek
let cachedDeptMap: Record<string, string> = {};

async function resolveDeptId(rawDeptId: string): Promise<string> {
  // Zaten geçerli bir UUID ise doğrudan kullan
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(rawDeptId)) {
    return rawDeptId;
  }

  if (!supabase) return rawDeptId;

  // Önbellek boşsa Supabase'den çek
  if (Object.keys(cachedDeptMap).length === 0) {
    const { data } = await supabase.from('departments').select('id, code');
    if (data && data.length > 0) {
      data.forEach(d => { cachedDeptMap[d.code] = d.id; });
    }
  }

  // 'dept-1' gibi mock ID'den koda dönüştür
  const mockDept = DEPARTMENTS.find(d => d.id === rawDeptId);
  const code = mockDept?.code || 'FEN';

  return cachedDeptMap[code] || Object.values(cachedDeptMap)[0] || rawDeptId;
}

export const dbService = {
  // Projeleri Getir
  async getProjects(): Promise<{ data: ProjectEvent[]; fromLive: boolean }> {
    if (!isSupabaseConfigured || !supabase) {
      return { data: INITIAL_PROJECTS, fromLive: false };
    }

    try {
      const { data: projData, error: projError } = await supabase
        .from('projects_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (projError || !projData || projData.length === 0) {
        return { data: INITIAL_PROJECTS, fromLive: false };
      }

      // Raporları al
      const { data: repData } = await supabase
        .from('event_reports')
        .select('*');

      const mapped: ProjectEvent[] = projData.map(p => {
        const report = repData?.find(r => r.project_id === p.id);
        let impactReport: ImpactReport | undefined;

        if (report) {
          impactReport = {
            id: report.id,
            projectId: report.project_id,
            actualParticipants: report.actual_participants,
            impactMetricValue: report.impact_metric_value,
            impactMetricUnit: report.impact_metric_unit,
            evaluationNotes: report.evaluation_notes,
            photoUrls: report.photo_urls,
            completedAt: report.completed_at,
          };
        }

        return {
          id: p.id,
          title: p.title,
          description: p.description,
          departmentId: p.department_id,
          advisorId: p.advisor_id || '',
          advisorName: p.advisor_name,
          eventType: p.event_type as any,
          sdgGoals: p.sdg_goals || [],
          targetGrades: p.target_grades || [],
          startDate: p.start_date,
          endDate: p.end_date,
          location: p.location,
          resourceNeeds: p.resource_needs,
          status: p.status as ProjectStatus,
          rejectionFeedback: p.rejection_feedback,
          createdAt: p.created_at,
          impactReport,
        };
      });

      return { data: mapped, fromLive: true };
    } catch (err) {
      console.warn('Supabase getProjects fallback to initial data:', err);
      return { data: INITIAL_PROJECTS, fromLive: false };
    }
  },

  // Yeni Proje Kaydet
  async createProject(project: Omit<ProjectEvent, 'id' | 'createdAt'>): Promise<string> {
    if (!isSupabaseConfigured || !supabase) {
      return `proj-${Date.now()}`;
    }

    try {
      const realDeptId = await resolveDeptId(project.departmentId);

      const { data, error } = await supabase
        .from('projects_events')
        .insert({
          title: project.title,
          description: project.description,
          department_id: realDeptId,
          advisor_name: project.advisorName,
          advisor_id: project.advisorId || '',
          event_type: project.eventType,
          sdg_goals: project.sdgGoals,
          target_grades: project.targetGrades,
          start_date: project.startDate,
          end_date: project.endDate || null,
          location: project.location,
          resource_needs: project.resourceNeeds || null,
          status: project.status,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Supabase createProject error:', error);
        return `proj-${Date.now()}`;
      }

      return data.id;
    } catch (e) {
      console.error('Supabase createProject exception:', e);
      return `proj-${Date.now()}`;
    }
  },

  // Proje Durumu Güncelle (Onay / Revizyon)
  async updateProjectStatus(projectId: string, status: ProjectStatus, feedback?: string) {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      const payload: any = { status };
      if (feedback !== undefined) {
        payload.rejection_feedback = feedback;
      }

      const { error } = await supabase
        .from('projects_events')
        .update(payload)
        .eq('id', projectId);

      if (error) console.error('Supabase updateStatus error:', error);
    } catch (e) {
      console.error('Supabase updateStatus exception:', e);
    }
  },

  // Etki Raporu Kaydet
  async saveImpactReport(projectId: string, report: Omit<ImpactReport, 'id' | 'completedAt'>) {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      await supabase
        .from('projects_events')
        .update({ status: 'completed' })
        .eq('id', projectId);

      const { error } = await supabase
        .from('event_reports')
        .insert({
          project_id: projectId,
          actual_participants: report.actualParticipants,
          impact_metric_value: report.impactMetricValue || 0,
          impact_metric_unit: report.impactMetricUnit || '',
          evaluation_notes: report.evaluationNotes || '',
          photo_urls: report.photoUrls || [],
        });

      if (error) console.error('Supabase saveImpactReport error:', error);
    } catch (e) {
      console.error('Supabase saveImpactReport exception:', e);
    }
  },

  // Müfredat Verilerini Getir
  async getCurriculums(): Promise<CurriculumIntegration[]> {
    if (!isSupabaseConfigured || !supabase) return INITIAL_CURRICULUM;

    try {
      const { data, error } = await supabase
        .from('curriculum_integrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) return INITIAL_CURRICULUM;

      return data.map(c => ({
        id: c.id,
        departmentId: c.department_id,
        teacherName: c.teacher_name,
        courseName: c.course_name,
        gradeLevel: c.grade_level,
        learningOutcome: c.learning_outcome,
        sdgGoals: c.sdg_goals || [],
        activityDescription: c.activity_description,
        studentCount: c.student_count,
        academicTerm: c.academic_term,
      }));
    } catch (err) {
      console.warn('Supabase getCurriculums fallback:', err);
      return INITIAL_CURRICULUM;
    }
  },

  // Yeni Müfredat Ekle
  async createCurriculum(curr: Omit<CurriculumIntegration, 'id'>) {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      const realDeptId = await resolveDeptId(curr.departmentId);
      await supabase.from('curriculum_integrations').insert({
        department_id: realDeptId,
        teacher_name: curr.teacherName,
        course_name: curr.courseName,
        grade_level: curr.gradeLevel,
        learning_outcome: curr.learningOutcome,
        sdg_goals: curr.sdgGoals,
        activity_description: curr.activityDescription,
        student_count: curr.studentCount,
        academic_term: curr.academicTerm,
      });
    } catch (e) {
      console.error('Supabase createCurriculum exception:', e);
    }
  },

  // Kampüs Metriklerini Getir
  async getCampusMetrics(): Promise<CampusMetric[]> {
    if (!isSupabaseConfigured || !supabase) return INITIAL_CAMPUS_METRICS;

    try {
      const { data, error } = await supabase
        .from('campus_metrics')
        .select('*')
        .order('period', { ascending: true });

      if (error || !data || data.length === 0) return INITIAL_CAMPUS_METRICS;

      return data.map(m => ({
        id: m.id,
        period: m.period,
        electricityKwh: Number(m.electricity_kwh),
        waterM3: Number(m.water_m3),
        paperReams: Number(m.paper_reams),
        recyclingPaperKg: Number(m.recycling_paper_kg),
        recyclingPlasticKg: Number(m.recycling_plastic_kg),
        recyclingGlassKg: Number(m.recycling_glass_kg),
        recyclingMetalKg: Number(m.recycling_metal_kg),
        compostOrganicKg: Number(m.compost_organic_kg),
        specialEwasteKg: Number(m.special_ewaste_kg),
        notes: m.notes,
      }));
    } catch (err) {
      console.warn('Supabase getCampusMetrics fallback:', err);
      return INITIAL_CAMPUS_METRICS;
    }
  },

  // Yeni Kampüs Metriği Ekle
  async createCampusMetric(metric: Omit<CampusMetric, 'id'>) {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      await supabase.from('campus_metrics').insert({
        period: metric.period,
        electricity_kwh: metric.electricityKwh,
        water_m3: metric.waterM3,
        paper_reams: metric.paperReams,
        recycling_paper_kg: metric.recyclingPaperKg,
        recyclingPlasticKg: metric.recyclingPlasticKg,
        recyclingGlassKg: metric.recyclingGlassKg,
        recyclingMetalKg: metric.recyclingMetalKg,
        compost_organic_kg: metric.compostOrganicKg,
        special_ewaste_kg: metric.specialEwasteKg,
        notes: metric.notes || null,
      });
    } catch (e) {
      console.error('Supabase createCampusMetric exception:', e);
    }
  },

  // Supabase Boşsa Başlangıç Örnek Verilerini Yükleme Yardımcısı (Seed)
  async seedInitialData(): Promise<{ success: boolean; message: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, message: 'Supabase bağlantısı henüz yapılandırılmadı.' };
    }

    try {
      // 1. Bölümleri kontrol et ve ekle
      const { data: existingDepts } = await supabase.from('departments').select('id, code');
      let deptMap: Record<string, string> = {};

      if (existingDepts && existingDepts.length > 0) {
        existingDepts.forEach(d => { deptMap[d.code] = d.id; });
      } else {
        const { data: insertedDepts } = await supabase
          .from('departments')
          .insert(DEPARTMENTS.map(d => ({
            name: d.name,
            code: d.code,
            color: d.color,
            head_name: d.headName,
          })))
          .select('id, code');

        insertedDepts?.forEach(d => { deptMap[d.code] = d.id; });
      }

      cachedDeptMap = { ...deptMap };

      // 2. Projeleri ekle
      for (const p of INITIAL_PROJECTS) {
        const targetDeptCode = DEPARTMENTS.find(d => d.id === p.departmentId)?.code || 'FEN';
        const deptId = deptMap[targetDeptCode] || Object.values(deptMap)[0];

        const { data: newProj, error: pError } = await supabase
          .from('projects_events')
          .insert({
            title: p.title,
            description: p.description,
            department_id: deptId,
            advisor_name: p.advisorName,
            advisor_id: p.advisorId || '',
            event_type: p.eventType,
            sdg_goals: p.sdgGoals,
            target_grades: p.targetGrades,
            start_date: p.startDate,
            end_date: p.endDate || null,
            location: p.location,
            resource_needs: p.resourceNeeds || null,
            status: p.status,
            rejection_feedback: p.rejectionFeedback || null,
          })
          .select('id')
          .single();

        if (pError) {
          console.error('Seed project error:', pError);
        }

        if (newProj && p.impactReport) {
          await supabase.from('event_reports').insert({
            project_id: newProj.id,
            actual_participants: p.impactReport.actualParticipants,
            impact_metric_value: p.impactReport.impactMetricValue || 0,
            impact_metric_unit: p.impactReport.impactMetricUnit || '',
            evaluation_notes: p.impactReport.evaluationNotes || '',
            photo_urls: p.impactReport.photoUrls || [],
          });
        }
      }

      // 3. Müfredatı ekle
      for (const c of INITIAL_CURRICULUM) {
        const targetDeptCode = DEPARTMENTS.find(d => d.id === c.departmentId)?.code || 'FEN';
        const deptId = deptMap[targetDeptCode] || Object.values(deptMap)[0];

        await supabase.from('curriculum_integrations').insert({
          department_id: deptId,
          teacher_name: c.teacherName,
          course_name: c.courseName,
          grade_level: c.gradeLevel,
          learning_outcome: c.learningOutcome,
          sdg_goals: c.sdgGoals,
          activity_description: c.activityDescription,
          student_count: c.studentCount,
          academic_term: c.academicTerm,
        });
      }

      // 4. Metrikleri ekle
      for (const m of INITIAL_CAMPUS_METRICS) {
        await supabase.from('campus_metrics').insert({
          period: m.period,
          electricity_kwh: m.electricityKwh,
          water_m3: m.waterM3,
          paper_reams: m.paperReams,
          recycling_paper_kg: m.recyclingPaperKg,
          recycling_plastic_kg: m.recyclingPlasticKg,
          recyclingGlassKg: m.recyclingGlassKg,
          recyclingMetalKg: m.recyclingMetalKg,
          compost_organic_kg: m.compostOrganicKg,
          special_ewaste_kg: m.specialEwasteKg,
          notes: m.notes || null,
        });
      }

      return { success: true, message: 'Örnek veriler Supabase veritabanına başarıyla aktarıldı!' };
    } catch (e: any) {
      console.error('Seed exception:', e);
      return { success: false, message: `Hata oluştu: ${e.message || 'Bilinmeyen hata'}` };
    }
  }
};
