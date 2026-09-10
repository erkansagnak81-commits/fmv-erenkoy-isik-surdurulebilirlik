import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { dbService } from '../../lib/dbService';
import { isFirebaseConfigured } from '../../lib/firebase';
import { 
  ShieldCheck, 
  AlertCircle, 
  Sparkles, 
  Lock,
  ArrowRight,
  UserCheck,
  ChevronRight,
  HelpCircle,
  X
} from 'lucide-react';

interface LoginModalProps {
  onLogin: (user: UserProfile) => void;
  profiles: UserProfile[];
}

export const LoginModal: React.FC<LoginModalProps> = ({
  onLogin,
  profiles,
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAccountChooserOpen, setIsAccountChooserOpen] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [isEnteringCustomEmail, setIsEnteringCustomEmail] = useState(false);

  // Google ile Giriş Başlat (Firebase Google Popup Açılır)
  const handleGoogleSignInClick = async () => {
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const { user, error } = await dbService.signInWithGoogle();

      if (error) {
        setIsLoading(false);
        // Popup kullanıcı tarafından kapatıldıysa veya yerel test gerekiyorsa
        if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
          return;
        }
        // İsteğe bağlı olarak yerel hesap seçiciyi aç
        setIsAccountChooserOpen(true);
        return;
      }

      if (user?.email) {
        const cleanEmail = user.email.trim().toLowerCase();
        const matchedProfile = profiles.find(p => p.email.toLowerCase() === cleanEmail);

        if (matchedProfile) {
          setIsLoading(false);
          onLogin(matchedProfile);
        } else {
          setIsLoading(false);
          await dbService.logOut();
          setErrorMsg('Yetkisiz Erişim: Bu hesap için sistemde yetkilendirilmiş bir rol bulunamadı. Lütfen sistem yöneticisi ile iletişime geçiniz.');
        }
      }
    } catch (err) {
      setIsLoading(false);
      setIsAccountChooserOpen(true);
    }
  };

  // Seçilen Google Hesabı ile Giriş Denemesi (Yerel Test)
  const handleSelectGoogleAccount = (email: string) => {
    setErrorMsg(null);
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const matchedProfile = profiles.find(p => p.email.toLowerCase() === cleanEmail);

    setTimeout(() => {
      setIsLoading(false);
      if (matchedProfile) {
        setIsAccountChooserOpen(false);
        onLogin(matchedProfile);
      } else {
        setErrorMsg('Yetkisiz Erişim: Bu hesap için sistemde yetkilendirilmiş bir rol bulunamadı. Lütfen sistem yöneticisi ile iletişime geçiniz.');
      }
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Üst Başlık & Prestijli Kurumsal Alan */}
        <div className="relative bg-gradient-to-br from-emerald-900 via-slate-900 to-emerald-950 p-7 text-white text-center">
          <div className="mx-auto w-14 h-14 bg-white/10 rounded-2xl shadow-inner flex items-center justify-center mb-3 border border-white/20">
            <ShieldCheck className="w-8 h-8 text-emerald-300" />
          </div>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-2">
            <span>Feyziye Mektepleri Vakfı 1885</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            FMV Erenköy Işık Lisesi ve Fen Lisesi
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200 font-medium mt-1">
            Sürdürülebilirlik &amp; Çevre Yönetim Portalı
          </p>
        </div>

        {/* Giriş Alanı */}
        <div className="p-6 sm:p-7 space-y-5">
          {/* Hata Bildirimi */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">{errorMsg}</p>
                <p className="text-[11px] text-rose-700">
                  Yalnızca yönetici tarafından tanımlanmış personeller giriş yapabilir.
                </p>
              </div>
            </div>
          )}

          {/* Bilgi Kutusu */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Yetkili Kurumsal Erişim</span>
            </div>
            <p className="leading-relaxed text-slate-600">
              Bu portala sadece sistem yöneticisi tarafından önceden rol tanımlanmış okul personelleri kurumsal Google hesapları ile erişebilir.
            </p>
          </div>

          {/* Google ile Giriş Butonu */}
          <button
            type="button"
            onClick={handleGoogleSignInClick}
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm text-slate-800 bg-white hover:bg-slate-50 active:bg-slate-100 border-2 border-slate-200 hover:border-slate-300 transition-all shadow-sm flex items-center justify-center gap-3 group disabled:opacity-50"
          >
            {/* Resmi Google Logosu */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span className="group-hover:text-slate-950">
              {isLoading ? 'Giriş Yapılıyor...' : 'Google ile Giriş Yap'}
            </span>
          </button>

          {/* Alt Bilgi & Hızlı Rol Seçici */}
          <div className="pt-2 text-center text-[11px] text-slate-400 space-y-1">
            <button
              type="button"
              onClick={() => setIsAccountChooserOpen(true)}
              className="text-xs text-slate-500 hover:text-emerald-700 font-medium underline transition-colors cursor-pointer"
            >
              Tanımlı Personel / Rol Listesinden Seç
            </button>
            <p>Sistem Yöneticisi: Erkan Sağnak</p>
          </div>
        </div>

      </div>

      {/* Google Hesap Seçici Penceresi */}
      {isAccountChooserOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Google Başlık */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <h3 className="font-bold text-slate-900 text-sm">
                  Bir Google Hesabı Seçin
                </h3>
              </div>
              <button
                onClick={() => setIsAccountChooserOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Yetkili Google Hesapları Listesi */}
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
                Yönetici Tarafından Tanımlı Hesaplar
              </p>

              {profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectGoogleAccount(p.email)}
                  className="w-full p-3 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 shrink-0">
                      {p.avatar ? (
                        <img src={p.avatar} alt={p.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        p.name.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-900 truncate">
                        {p.name}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono truncate">
                        {p.email.toLowerCase() === 'erkan.sagnak@fmvisik.k12.tr'
                          ? 'Sürdürülebilirlik Koordinatörlüğü'
                          : p.email}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border shrink-0 ${
                    p.role === 'coordinator' || p.role === 'admin'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : p.role === 'dept_head'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-amber-100 text-amber-800 border-amber-200'
                  }`}>
                    {p.role === 'coordinator' || p.role === 'admin' 
                      ? 'Yönetici' 
                      : p.role === 'dept_head' 
                      ? 'Bölüm Başkanı' 
                      : 'Öğretmen'}
                  </span>
                </button>
              ))}

              {/* Başka Bir Hesapla Deneme (Yetki Kontrolünü Test Etmek İçin) */}
              <div className="pt-2 border-t border-slate-100">
                {!isEnteringCustomEmail ? (
                  <button
                    type="button"
                    onClick={() => setIsEnteringCustomEmail(true)}
                    className="w-full py-2.5 px-3 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors text-center"
                  >
                    Başka bir hesap ile giriş dene
                  </button>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-2xl space-y-2">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Google E-Posta Adresi
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="ornek@fmvisik.k12.tr"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => handleSelectGoogleAccount(customEmail)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700"
                      >
                        Dene
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
