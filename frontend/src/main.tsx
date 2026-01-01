import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './utils/i18n'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered successfully:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New version available! Please refresh.');
                // Show update notification to user
                if (confirm('New version available! Reload to update?')) {
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });
  });

  // Handle service worker updates
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[PWA] Service Worker updated');
  });
}

// Request notification permission for PWA
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission().then((permission) => {
    console.log('[PWA] Notification permission:', permission);
  });
}

