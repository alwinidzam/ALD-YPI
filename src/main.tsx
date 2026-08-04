import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ToastProvider } from './components/ToastProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { toast } from './lib/toastManager';

// Override window.alert globally for unified feedback
window.alert = (msg) => {
  if (msg.toString().toLowerCase().includes('gagal') || msg.toString().toLowerCase().includes('error')) {
    toast.error(msg.toString());
  } else if (msg.toString().toLowerCase().includes('harus') || msg.toString().toLowerCase().includes('tidak boleh')) {
    toast.warning(msg.toString());
  } else {
    toast.success(msg.toString());
  }
};

import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider />
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// Register the service worker so the app satisfies PWA installability criteria
// and repeat launches load instantly from cache like a native app.
// Without this (and without public/manifest.webmanifest), the 'beforeinstallprompt'
// event used by the in-app "Pasang Aplikasi" button would simply never fire.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
}
