// ==========================================================================
// FMV Erenköy Işık Lisesi ve Fen Lisesi | PWA & Çevrimdışı Yönetim Yardımcısı
// ==========================================================================

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

type InstallListener = (installable: boolean) => void;
type OnlineListener = (isOnline: boolean) => void;

class PwaManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalled: boolean = false;
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private installListeners: Set<InstallListener> = new Set();
  private onlineListeners: Set<OnlineListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initListeners();
    }
  }

  private initListeners() {
    // 1. PWA Yükleme Olayını Yakala (Chrome / Edge / Android)
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.notifyInstallListeners(true);
    });

    // 2. Uygulama Yüklendi Olayı
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.isInstalled = true;
      this.notifyInstallListeners(false);
      console.log('PWA başarıyla yüklendi.');
    });

    // 3. Ekran Modu Kontrolü (Standalone PWA olarak mı çalışıyor?)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      this.isInstalled = true;
    }

    // 4. Çevrimdışı / Çevrimiçi Olayları
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyOnlineListeners(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyOnlineListeners(false);
    });
  }

  // Service Worker Kaydı
  public registerServiceWorker() {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((registration) => {
            console.log('PWA Servis Çalışanı devrede, kapsam:', registration.scope);

            // Periyodik güncelleme kontrolü (1 saatte bir veya sekme odağında)
            setInterval(() => {
              registration.update().catch(() => {});
            }, 60 * 60 * 1000);
          })
          .catch((err) => {
            console.warn('PWA Servis Çalışanı kaydı uyarısı:', err);
          });
      });
    }
  }

  // Yükleme İstemi Başlat
  public async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }
    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('Kullanıcı PWA kurulumunu onayladı.');
        this.deferredPrompt = null;
        this.notifyInstallListeners(false);
        return true;
      } else {
        console.log('Kullanıcı PWA kurulumunu erteledi.');
        return false;
      }
    } catch (err) {
      console.error('PWA kurulum hatası:', err);
      return false;
    }
  }

  public getIsInstallable(): boolean {
    return Boolean(this.deferredPrompt && !this.isInstalled);
  }

  public getIsInstalled(): boolean {
    return this.isInstalled;
  }

  public getIsOnline(): boolean {
    return this.isOnline;
  }

  public subscribeInstall(listener: InstallListener): () => void {
    this.installListeners.add(listener);
    listener(this.getIsInstallable());
    return () => this.installListeners.delete(listener);
  }

  public subscribeOnline(listener: OnlineListener): () => void {
    this.onlineListeners.add(listener);
    listener(this.isOnline);
    return () => this.onlineListeners.delete(listener);
  }

  private notifyInstallListeners(installable: boolean) {
    this.installListeners.forEach((l) => l(installable));
  }

  private notifyOnlineListeners(isOnline: boolean) {
    this.onlineListeners.forEach((l) => l(isOnline));
  }
}

export const pwaManager = new PwaManager();
