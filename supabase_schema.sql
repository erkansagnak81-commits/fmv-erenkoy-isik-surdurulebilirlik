-- ==============================================================================
-- LİSE SÜRDÜRÜLEBİLİRLİK EKOSİSTEMİ (ECOCAMPUS)
-- SUPABASE POSTGRESQL VERİTABANI ŞEMASI (GÜNCEL & TEMİZ KURULUM)
-- ==============================================================================

-- 0. Eski tablolar varsa temizle
DROP TABLE IF EXISTS event_reports CASCADE;
DROP TABLE IF EXISTS projects_events CASCADE;
DROP TABLE IF EXISTS curriculum_integrations CASCADE;
DROP TABLE IF EXISTS campus_metrics CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- 1. Özel ENUM Tipleri
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('teacher', 'dept_head', 'coordinator', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM (
        'draft',
        'submitted',
        'dept_approved',
        'coordinator_approved',
        'revision_needed',
        'completed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Bölümler (Zümreler) Tablosu
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE, -- 'FEN', 'SOS', 'MAT', 'DIL', 'SAN', 'IDA'
    color TEXT DEFAULT '#10b981',
    head_name TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Kullanıcı Profilleri Tablosu
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role user_role DEFAULT 'teacher'::user_role NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    title TEXT DEFAULT '',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Proje ve Etkinlikler Tablosu
CREATE TABLE projects_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE NOT NULL,
    advisor_name TEXT NOT NULL,
    advisor_id TEXT DEFAULT '',
    event_type TEXT NOT NULL,
    sdg_goals INTEGER[] NOT NULL DEFAULT '{}',
    target_grades TEXT[] NOT NULL DEFAULT '{}',
    start_date DATE NOT NULL,
    end_date DATE,
    location TEXT DEFAULT 'Okul Konferans Salonu',
    resource_needs TEXT,
    status project_status DEFAULT 'submitted'::project_status NOT NULL,
    rejection_feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Etkinlik Kapanış & Etki Değerlendirme Raporu
CREATE TABLE event_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects_events(id) ON DELETE CASCADE UNIQUE NOT NULL,
    actual_participants INTEGER NOT NULL DEFAULT 0,
    impact_metric_value NUMERIC DEFAULT 0,
    impact_metric_unit TEXT DEFAULT '',
    evaluation_notes TEXT DEFAULT '',
    photo_urls TEXT[] DEFAULT '{}',
    completed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Müfredat & Ders İçi SKA Entegrasyon Tablosu
CREATE TABLE curriculum_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE NOT NULL,
    teacher_name TEXT NOT NULL,
    course_name TEXT NOT NULL,
    grade_level TEXT NOT NULL,
    learning_outcome TEXT NOT NULL,
    sdg_goals INTEGER[] NOT NULL DEFAULT '{}',
    activity_description TEXT NOT NULL,
    student_count INTEGER NOT NULL DEFAULT 0,
    academic_term TEXT NOT NULL DEFAULT '2026-2027 Güz',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Yeşil Kampüs Tüketim & Atık Metrikleri
CREATE TABLE campus_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period TEXT NOT NULL UNIQUE,
    electricity_kwh NUMERIC DEFAULT 0,
    water_m3 NUMERIC DEFAULT 0,
    paper_reams INTEGER DEFAULT 0,
    recycling_paper_kg NUMERIC DEFAULT 0,
    recycling_plastic_kg NUMERIC DEFAULT 0,
    recycling_glass_kg NUMERIC DEFAULT 0,
    recycling_metal_kg NUMERIC DEFAULT 0,
    compost_organic_kg NUMERIC DEFAULT 0,
    special_ewaste_kg NUMERIC DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Başlangıç Bölüm / Zümre Verisi (FMV Erenköy Işık Lisesi ve Fen Lisesi)
INSERT INTO departments (name, code, color, head_name) VALUES
    ('Fen Bilimleri Bölümü', 'FEN', '#10b981', 'Servet Battal'),
    ('Matematik Bölümü', 'MAT', '#8b5cf6', 'Funda Akbulut Demirel'),
    ('Türk Dili ve Edebiyatı', 'EDB', '#eab308', 'Pınar Usta Altıner'),
    ('Sosyal Bilimler', 'SOS', '#3b82f6', 'Kadir Can Tunay'),
    ('Yabancı Diller Bölümü', 'DIL', '#ec4899', 'Eda Nezihe Üçöz'),
    ('Uygulamalı Dersler (Görsel Sanatlar, Müzik, Beden)', 'UYG', '#f97316', 'Işıl Zaza Tozlu'),
    ('Rehberlik ve Psikolojik Danışmanlık', 'PDR', '#06b6d4', 'Özlem Sendan')
ON CONFLICT (code) DO NOTHING;

-- 9. Row Level Security (RLS) Politikaları (Public Okuma ve Yazma İzni)
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access for departments" ON departments FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for profiles" ON profiles FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for projects_events" ON projects_events FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for event_reports" ON event_reports FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for curriculum_integrations" ON curriculum_integrations FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for campus_metrics" ON campus_metrics FOR ALL TO public USING (true) WITH CHECK (true);
