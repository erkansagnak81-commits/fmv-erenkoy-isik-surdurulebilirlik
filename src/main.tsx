import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { pwaManager } from './lib/pwa'

// PWA Servis Çalışanını Kaydet
pwaManager.registerServiceWorker();

// Eski PDF önbelleğini temizle (Chromium UUID dosya adı sorununu önlemek için)
if (typeof window !== 'undefined' && 'caches' in window) {
  caches.keys().then((keys) => {
    keys.forEach((key) => {
      caches.open(key).then((cache) => {
        cache.delete('/FMV_Erenkoy_Isik_Surdurulebilirlik_Kullanim_Kilavuzu.pdf');
      });
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
