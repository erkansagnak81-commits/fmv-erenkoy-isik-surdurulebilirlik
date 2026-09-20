import { AppTab, RoleActionPermissions, SystemRolePermissions, UserProfile } from '../types';
import { isSuperAdminEmail } from './index';

export interface TabMeta {
  id: AppTab;
  label: string;
  description: string;
  category: 'core' | 'management' | 'admin';
}

export const APP_TABS_META: TabMeta[] = [
  {
    id: 'dashboard',
    label: 'Gösterge Paneli',
    description: 'Bireysel veya okul geneli sürdürülebilirlik özet paneli ve temel metrikler.',
    category: 'core'
  },
  {
    id: 'calendar',
    label: 'Okul Takvimi',
    description: 'Onaylanmış ve okul takvimine yerleştirilmiş etkinliklerin aylık/haftalık takvim görünümü.',
    category: 'core'
  },
  {
    id: 'projects',
    label: 'Proje & Etkinlik Havuzu',
    description: 'Tüm zümrelerin taslak, onayda ve tamamlanmış faaliyet havuzu.',
    category: 'core'
  },
  {
    id: 'approvals',
    label: 'Onay Masası',
    description: 'Bölüm başkanı ve koordinatör onay kuyruğu, geri bildirim ve onay yönetimi.',
    category: 'management'
  },
  {
    id: 'curriculum',
    label: 'Müfredat & SKA Matrisi',
    description: 'Ders bazlı sürdürülebilirlik kazanım eşleştirmeleri ve öğrenci katılım verileri.',
    category: 'core'
  },
  {
    id: 'campus',
    label: 'Yeşil Kampüs Metrikleri',
    description: 'Elektrik, su, kağıt tüketimi ve geri dönüşüm / kompost atık takip verileri.',
    category: 'management'
  },
  {
    id: 'reports',
    label: 'Sürdürülebilirlik Raporu',
    description: 'Yıllık kurumsal sürdürülebilirlik çıktısı ve akreditasyon raporlama alanı.',
    category: 'core'
  },
  {
    id: 'users',
    label: 'Kullanıcı & Rol Yönetimi',
    description: 'Öğretmen profilleri, zümre atamaları ve rol/yetki matrisi kontrol paneli.',
    category: 'admin'
  }
];

export interface PermissionItemMeta {
  key: keyof RoleActionPermissions;
  label: string;
  description: string;
}

export interface PermissionGroupMeta {
  id: string;
  title: string;
  description: string;
  items: PermissionItemMeta[];
}

export const PERMISSION_GROUPS: PermissionGroupMeta[] = [
  {
    id: 'projects',
    title: 'Proje & Faaliyet İşlem Yetkileri',
    description: 'Sürdürülebilirlik faaliyetlerinin başlatılması, güncellenmesi ve onay süreçleri.',
    items: [
      {
        key: 'canCreateProject',
        label: 'Yeni Proje / Faaliyet Başlatma',
        description: 'Yeni bir sürdürülebilirlik projesi veya etkinlik önerisi formu doldurabilme.'
      },
      {
        key: 'canEditOwnProject',
        label: 'Kendi Projelerini Düzenleme',
        description: 'Danışmanı veya işbirlikçisi olduğu taslak / revizyonlu projeleri güncelleyebilme.'
      },
      {
        key: 'canEditDeptProject',
        label: 'Zümre Projelerini Düzenleme',
        description: 'Kendi bölümüne ait öğretmenlerin projelerini inceleyip düzenleyebilme.'
      },
      {
        key: 'canEditAllProjects',
        label: 'Tüm Okul Projelerini Düzenleme',
        description: 'Zümre fark etmeksizin sistemdeki tüm projeleri güncelleyebilme.'
      },
      {
        key: 'canDeleteProject',
        label: 'Proje Silme Yetkisi',
        description: 'Taslak veya onay sürecindeki projeleri sistemden kalıcı olarak silebilme.'
      },
      {
        key: 'canApproveDept',
        label: 'Bölüm Başkanı (Zümre) Onayı Verme',
        description: 'Zümresinden gelen başvuruları inceleyip onaylama veya revizyon isteme.'
      },
      {
        key: 'canApproveCoordinator',
        label: 'Koordinatör Onayı Verme (Takvime Alma)',
        description: 'Projeleri nihai olarak onaylayıp resmi okul takviminde yayınlama.'
      },
      {
        key: 'canSubmitReport',
        label: 'Etki & Kapanış Raporu Girme',
        description: 'Gerçekleşen etkinlikler için katılımcı sayısı, etki çıktısı ve fotoğraf raporlama.'
      },
      {
        key: 'canExportProjects',
        label: 'Projeleri Excel / CSV Olarak İndirme',
        description: 'Faaliyet listesini dışa aktarabilme.'
      }
    ]
  },
  {
    id: 'curriculum',
    title: 'Müfredat & SKA Entegrasyon Yetkileri',
    description: 'Ders içi sürdürülebilirlik kazanımlarının kayıt ve yönetim hakları.',
    items: [
      {
        key: 'canCreateCurriculum',
        label: 'Yeni Müfredat Entegrasyonu Ekleme',
        description: 'Ders planına ait SKA odaklı kazanım ve etkinlik kaydı oluşturabilme.'
      },
      {
        key: 'canEditOwnCurriculum',
        label: 'Kendi Müfredat Kayıtlarını Düzenleme / Silme',
        description: 'Kendisine ait kazanım kayıtlarını güncelleyebilme ve silebilme.'
      },
      {
        key: 'canEditAllCurriculum',
        label: 'Tüm Zümrelerin Müfredat Kayıtlarını Yönetme',
        description: 'Diğer branş ve öğretmenlerin müfredat kayıtlarını düzenleyebilme/silebilme.'
      },
      {
        key: 'canExportCurriculum',
        label: 'Müfredat Verilerini Excel / CSV İndirme',
        description: 'Müfredat matrisini tablo formatında bilgisayara indirebilme.'
      }
    ]
  },
  {
    id: 'campus',
    title: 'Yeşil Kampüs & Kaynak Yönetimi Yetkileri',
    description: 'Kampüs elektrik, su ve atık dönüşüm metriklerinin yönetimi.',
    items: [
      {
        key: 'canEditCampusMetrics',
        label: 'Metrik Değerlerini Ekleme ve Güncelleme',
        description: 'Aylık elektrik, su, kağıt ve geri dönüşüm verilerini sisteme işleyebilme.'
      },
      {
        key: 'canResetCampusMetrics',
        label: 'Tüm Kampüs Metriklerini Sıfırlama',
        description: 'Geçmiş kampüs tüketim ve atık verilerini topluca temizleyebilme (Kritik Yetki).'
      }
    ]
  },
  {
    id: 'system',
    title: 'Sistem & Yönetim Yetkileri',
    description: 'Kullanıcı personelleri ve eğitim-öğretim yılı takvim yönetimi.',
    items: [
      {
        key: 'canManageUsers',
        label: 'Kullanıcı ve Personel Yönetimi',
        description: 'Yeni öğretmen tanımlama, bilgileri/fotoğrafları güncelleme ve personeli silme.'
      },
      {
        key: 'canManageAcademicYears',
        label: 'Eğitim-Öğretim Yılı Yönetimi',
        description: 'Dönem tarihleri ekleme, aktif yılı belirleme ve öğrenci mevcudu güncelleme.'
      }
    ]
  }
];

// Varsayılan Kurumsal Rol ve Yetki Matrisi
export const DEFAULT_ROLE_PERMISSIONS: SystemRolePermissions = {
  coordinator: {
    role: 'coordinator',
    roleName: 'Sürdürülebilirlik Koordinatörü',
    description: 'Okul genelindeki tüm sürdürülebilirlik projelerini, takvimi, onay süreçlerini ve raporlamayı yönetir.',
    allowedTabs: ['dashboard', 'calendar', 'projects', 'approvals', 'curriculum', 'campus', 'reports', 'users'],
    permissions: {
      canCreateProject: true,
      canEditOwnProject: true,
      canEditDeptProject: true,
      canEditAllProjects: true,
      canDeleteProject: true,
      canApproveDept: true,
      canApproveCoordinator: true,
      canSubmitReport: true,
      canExportProjects: true,
      canCreateCurriculum: true,
      canEditOwnCurriculum: true,
      canEditAllCurriculum: true,
      canExportCurriculum: true,
      canEditCampusMetrics: true,
      canResetCampusMetrics: true,
      canManageUsers: true,
      canManageAcademicYears: true
    }
  },
  dept_head: {
    role: 'dept_head',
    roleName: 'Bölüm Başkanı / Zümre Başkanı',
    description: 'Kendi branş zümresindeki öğretmenlerin faaliyetlerini ve müfredat entegrasyonlarını denetler ve onaylar.',
    allowedTabs: ['dashboard', 'calendar', 'projects', 'approvals', 'curriculum', 'campus', 'reports'],
    permissions: {
      canCreateProject: true,
      canEditOwnProject: true,
      canEditDeptProject: true,
      canEditAllProjects: false,
      canDeleteProject: false,
      canApproveDept: true,
      canApproveCoordinator: false,
      canSubmitReport: true,
      canExportProjects: true,
      canCreateCurriculum: true,
      canEditOwnCurriculum: true,
      canEditAllCurriculum: false,
      canExportCurriculum: true,
      canEditCampusMetrics: false,
      canResetCampusMetrics: false,
      canManageUsers: false,
      canManageAcademicYears: false
    }
  },
  principal: {
    role: 'principal',
    roleName: 'Okul Müdürü',
    description: 'Okul genelindeki tüm projeleri, onayları, etkinlikleri, müfredat çalışmalarını, yeşil kampüs metriklerini ve kurumsal sürdürülebilirlik raporlarını izler, onaylar ve denetler.',
    allowedTabs: ['dashboard', 'calendar', 'projects', 'approvals', 'curriculum', 'campus', 'reports', 'users'],
    permissions: {
      canCreateProject: true,
      canEditOwnProject: true,
      canEditDeptProject: true,
      canEditAllProjects: true,
      canDeleteProject: true,
      canApproveDept: true,
      canApproveCoordinator: true,
      canSubmitReport: true,
      canExportProjects: true,
      canCreateCurriculum: true,
      canEditOwnCurriculum: true,
      canEditAllCurriculum: true,
      canExportCurriculum: true,
      canEditCampusMetrics: true,
      canResetCampusMetrics: true,
      canManageUsers: true,
      canManageAcademicYears: true
    }
  },
  teacher: {
    role: 'teacher',
    roleName: 'Danışman Öğretmen',
    description: 'Kulüp ve ders bazında sürdürülebilirlik faaliyetleri önerir, projeleri yürütür ve etki raporlarını sunar.',
    allowedTabs: ['dashboard', 'calendar', 'projects', 'curriculum', 'campus', 'reports'],
    permissions: {
      canCreateProject: true,
      canEditOwnProject: true,
      canEditDeptProject: false,
      canEditAllProjects: false,
      canDeleteProject: false,
      canApproveDept: false,
      canApproveCoordinator: false,
      canSubmitReport: true,
      canExportProjects: true,
      canCreateCurriculum: true,
      canEditOwnCurriculum: true,
      canEditAllCurriculum: false,
      canExportCurriculum: true,
      canEditCampusMetrics: false,
      canResetCampusMetrics: false,
      canManageUsers: false,
      canManageAcademicYears: false
    }
  },
  admin: {
    role: 'admin',
    roleName: 'Sistem Yöneticisi',
    description: 'Tüm yetkilere, modüllere ve teknik ayarlara sınırsız tam erişime sahiptir.',
    allowedTabs: ['dashboard', 'calendar', 'projects', 'approvals', 'curriculum', 'campus', 'reports', 'users'],
    permissions: {
      canCreateProject: true,
      canEditOwnProject: true,
      canEditDeptProject: true,
      canEditAllProjects: true,
      canDeleteProject: true,
      canApproveDept: true,
      canApproveCoordinator: true,
      canSubmitReport: true,
      canExportProjects: true,
      canCreateCurriculum: true,
      canEditOwnCurriculum: true,
      canEditAllCurriculum: true,
      canExportCurriculum: true,
      canEditCampusMetrics: true,
      canResetCampusMetrics: true,
      canManageUsers: true,
      canManageAcademicYears: true
    }
  }
};

/**
 * Kullanıcının belirli bir işlemi gerçekleştirme yetkisine sahip olup olmadığını denetler.
 * Öncelik sırası:
 * 1. Süper Yönetici veya Admin her zaman yetkilidir.
 * 2. Kullanıcı profili özel yetkileri (customPermissions).
 * 3. Role atanmış genel izin (permissions[key] === true).
 * 4. Bu izne özel atanmış kişi listesi (assignedUsers[key] includes userId).
 */
export function hasUserActionPermission(
  user: UserProfile | undefined | null,
  permissionKey: keyof RoleActionPermissions,
  rolePermissions?: SystemRolePermissions | null
): boolean {
  if (!user) return false;

  // 1. Süper Yönetici veya Sistem Yöneticisi
  if (isSuperAdminEmail(user.email) || user.role === 'admin') {
    return true;
  }

  // 2. Kullanıcı Profilinde Doğrudan Tanımlı Özel Yetki
  if (user.customPermissions && user.customPermissions[permissionKey] !== undefined) {
    return !!user.customPermissions[permissionKey];
  }

  if (!rolePermissions) return false;
  const roleConfig = rolePermissions[user.role];
  if (!roleConfig) return false;

  // 3. İlgili roldeki kullanıcıya özel kişi bazlı atama (assignedUsers) yapılmış mı?
  if (roleConfig.assignedUsers?.[permissionKey]?.includes(user.id)) {
    return true;
  }

  // 4. Genel rol bazlı yetki açık mı?
  return !!roleConfig.permissions[permissionKey];
}

