import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

// Toast context -----------------------------------------------------------
// Lightweight toast system that works without any external library.
// Toasts are stored in state, auto-dismiss after `duration` ms, and rendered
// by <ToastViewport /> which you mount once at the app shell. Call
// useToast().show('Saved!', { type: 'success' }) from anywhere.

const ToastContext = createContext(null);

let nextId = 1;

export function ToastProvider({ children, viewport }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const handle = timers.current.get(id);
    if (handle) {
      clearTimeout(handle);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (message, options = {}) => {
      const id = nextId++;
      const toast = {
        id,
        message,
        type: options.type || 'info',
        title: options.title,
        duration: typeof options.duration === 'number' ? options.duration : 3200,
      };
      setToasts((list) => [...list, toast]);
      const handle = setTimeout(() => dismiss(id), toast.duration);
      timers.current.set(id, handle);
      return id;
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      show,
      dismiss,
      success: (message, opts = {}) => show(message, { ...opts, type: 'success' }),
      error: (message, opts = {}) => show(message, { ...opts, type: 'error' }),
      info: (message, opts = {}) => show(message, { ...opts, type: 'info' }),
      warning: (message, opts = {}) => show(message, { ...opts, type: 'warning' }),
      toasts,
    }),
    [show, dismiss, toasts]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {viewport || <ToastViewport toasts={toasts} onDismiss={dismiss} />}
    </ToastContext.Provider>
  );
}

export function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="toast-viewport" role="region" aria-live="polite" aria-label="Notifications">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-card toast-${toast.type}`} role="status">
          <span className="toast-dot" aria-hidden="true" />
          <div className="toast-body">
            {toast.title ? <div className="toast-title">{toast.title}</div> : null}
            <div className="toast-message">{toast.message}</div>
          </div>
          <button
            type="button"
            className="toast-close"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }
  return ctx;
}
