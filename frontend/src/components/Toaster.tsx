// Toast notification wrapper using react-hot-toast

import { Toaster as HotToaster } from 'react-hot-toast';

export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--surface-secondary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '14px',
          maxWidth: '400px',
        },
        success: {
          iconTheme: {
            primary: 'var(--success-color, #2a9d8f)',
            secondary: 'white',
          },
        },
        error: {
          iconTheme: {
            primary: 'var(--error-color, #e63946)',
            secondary: 'white',
          },
          duration: 6000,
        },
        loading: {
          iconTheme: {
            primary: 'var(--accent-color, #457b9d)',
            secondary: 'white',
          },
        },
      }}
    />
  );
}
