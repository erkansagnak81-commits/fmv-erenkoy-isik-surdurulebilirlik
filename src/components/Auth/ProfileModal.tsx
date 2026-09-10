import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { UserProfile } from '../../types';
import { DEPARTMENTS } from '../../constants';
import { processImageFile } from '../../lib/imageUtils';
import { 
  User, 
  Camera, 
  Upload, 
  Link2, 
  X, 
  AlertCircle, 
  Lock
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdateAvatar: (newAvatar: string) => Promise<void>;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateAvatar,
}) => {
  const [avatar, setAvatar] = useState<string>(currentUser.avatar || '');
  const [isUrlInputOpen, setIsUrlInputOpen] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentDept = DEPARTMENTS.find(d => d.id === currentUser.departmentId);

  // Bilgisayardan Fotoğraf Seçimi
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg(null);
    try {
      const optimizedDataUrl = await processImageFile(file);
      setAvatar(optimizedDataUrl);
    } catch (err: any) {
      setErrorMsg(err.message || 'Fotoğraf işlenirken bir hata oluştu.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // URL Uygulama
  const handleApplyUrl = () => {
    if (!urlValue.trim()) return;
    setAvatar(urlValue.trim());
    setIsUrlInputOpen(false);
  };

  // Kaydetme
  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    try {
      await onUpdateAvatar(avatar);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Fotoğraf kaydedilirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="w-full max-w-md my-auto bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Başlık */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 font-bold backdrop-blur-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Profil Bilgilerim</h3>
              <p className="text-xs text-slate-300">Profil fotoğrafınızı güncelleyin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Fotoğraf Düzenleme & Önizleme Alanı */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center gap-3 text-center">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-white border-4 border-white shadow-md flex items-center justify-center font-bold text-slate-700 text-2xl">
                {avatar ? (
                  <img src={avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{currentUser.name ? currentUser.name.charAt(0).toUpperCase() : '👤'}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Bilgisayardan Fotoğraf Seç"
                className="absolute inset-0 bg-slate-900/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                <Camera className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-800">Vesikalık / Profil Fotoğrafı</p>
              <p className="text-[11px] text-slate-500">
                Bilgisayarınızdan fotoğraf yükleyebilir veya bağlantı verebilirsiniz.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isUploading ? 'İşleniyor...' : 'Fotoğraf Yükle'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsUrlInputOpen(!isUrlInputOpen)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <Link2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Web URL</span>
              </button>

              <button
                type="button"
                onClick={() => setAvatar('/logo.png')}
                className="px-2 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 transition cursor-pointer"
              >
                Işık Logosu
              </button>

              {avatar && (
                <button
                  type="button"
                  onClick={() => setAvatar('')}
                  className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 transition cursor-pointer"
                >
                  Kaldır
                </button>
              )}
            </div>

            {isUrlInputOpen && (
              <div className="w-full mt-2 pt-2 border-t border-slate-200 flex items-center gap-2 animate-in fade-in">
                <input
                  type="url"
                  placeholder="https://.../fotograf.jpg"
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition cursor-pointer"
                >
                  Uygula
                </button>
              </div>
            )}
          </div>

          {/* Sabit Kurumsal Bilgiler (Güvenlik Korumalı) */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Ad ve Soyad</span>
              <span className="font-bold text-slate-900">{currentUser.name}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Kurumsal E-posta</span>
              <span className="font-mono text-slate-700 font-semibold">{currentUser.email}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Yetki / Rol</span>
              <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {currentUser.role === 'coordinator' ? 'Koordinatör' : currentUser.role === 'dept_head' ? 'Bölüm Başkanı' : 'Danışman Öğretmen'}
              </span>
            </div>

            {currentUser.role === 'coordinator' || currentUser.role === 'admin' ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <span className="text-slate-500 font-medium">Zümre / Bölüm</span>
                <span className="font-bold text-emerald-800">Okul Geneli (Tüm Zümreler)</span>
              </div>
            ) : currentDept ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium">Zümre / Bölüm</span>
                <span className="font-semibold text-slate-800">{currentDept.name}</span>
              </div>
            ) : null}

            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 pt-1">
              <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span>Rol ve zümre yetkileri yalnızca Sistem Yöneticisi tarafından yönetilir.</span>
            </div>
          </div>

          {/* Butonlar */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'Kaydediliyor...' : 'Fotoğrafı Kaydet'}
            </button>
          </div>

        </div>

      </div>
    </div>,
    document.body
  );
};
