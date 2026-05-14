import { useCallback, useRef } from 'react';

/**
 * Hook for showing toast notifications.
 * Manages a single toast element, replacing previous ones.
 */
export function useToast() {
  const toastRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = useCallback((msg: string) => {
    // Remove existing
    if (toastRef.current) {
      toastRef.current.remove();
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const toast = document.createElement('div');
    Object.assign(toast.style, {
      position: 'fixed',
      top: '80px',
      left: '50%',
      transform: 'translateX(-50%) translateY(-10px)',
      background: 'rgba(30,30,30,0.95)',
      color: '#fff',
      padding: '10px 20px',
      borderRadius: '10px',
      fontSize: '13px',
      fontFamily: "var(--font, 'Inter', sans-serif)",
      zIndex: '9999',
      opacity: '0',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(74,222,128,0.2)',
      transition: 'opacity 0.3s, transform 0.3s',
      pointerEvents: 'none',
    });
    toast.textContent = msg;

    document.body.appendChild(toast);
    toastRef.current = toast;

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    timerRef.current = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(-10px)';
      setTimeout(() => {
        toast.remove();
        if (toastRef.current === toast) toastRef.current = null;
      }, 300);
    }, 1500);
  }, []);

  return showToast;
}
