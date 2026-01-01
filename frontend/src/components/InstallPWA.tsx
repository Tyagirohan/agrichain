import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const InstallPWA = () => {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;
    
    if (isInstalled) {
      console.log('[PWA] App is already installed');
      return;
    }

    // Check if user dismissed the banner before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const now = new Date();
      const daysSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show install banner after 3 seconds
      setTimeout(() => {
        setShowInstallBanner(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      console.log('[PWA] No install prompt available');
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User ${outcome} the install`);

    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  if (!showInstallBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl shadow-2xl p-6 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <span className="text-2xl">🌾</span>
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-bold mb-1">
              {t('installApp') || 'Install AgriChain'}
            </h3>
            <p className="text-sm text-green-50 mb-4">
              {t('installAppDescription') || 'Install our app for a better experience! Access offline, get notifications, and enjoy native app speed.'}
            </p>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleInstall}
                className="flex-1 bg-white text-green-600 px-4 py-2 rounded-lg font-semibold hover:bg-green-50 transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>{t('install') || 'Install'}</span>
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-white hover:bg-white/20 rounded-lg transition-colors font-medium"
              >
                {t('later') || 'Later'}
              </button>
            </div>

            <div className="mt-3 flex items-center space-x-4 text-xs text-green-100">
              <span className="flex items-center space-x-1">
                <span>✓</span>
                <span>{t('worksOffline') || 'Works Offline'}</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>✓</span>
                <span>{t('fastLoading') || 'Fast Loading'}</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>✓</span>
                <span>{t('nativeExperience') || 'Native Feel'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

