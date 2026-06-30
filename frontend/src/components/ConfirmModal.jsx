import { useEffect, useRef } from 'react';
import './ConfirmModal.css';

/**
 * ConfirmModal — Premium Antigravity-style confirmation dialog
 *
 * Props:
 *   open       {boolean}  – whether modal is visible
 *   title      {string}   – heading text
 *   message    {string}   – body text
 *   confirmLabel {string} – confirm button text (default "Delete")
 *   cancelLabel  {string} – cancel button text  (default "Cancel")
 *   variant    {string}   – "danger" | "warning" | "info"  (default "danger")
 *   onConfirm  {fn}       – called when user confirms
 *   onCancel   {fn}       – called when user cancels / presses Escape
 */
export default function ConfirmModal({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) {
  const cancelBtnRef = useRef(null);

  // Focus cancel button when modal opens
  useEffect(() => {
    if (open) cancelBtnRef.current?.focus();
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onCancel?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="cm-overlay" onClick={onCancel} role="dialog" aria-modal="true" aria-labelledby="cm-title">
      <div className={`cm-card cm-card--${variant}`} onClick={(e) => e.stopPropagation()}>

        {/* Icon */}
        <div className={`cm-icon cm-icon--${variant}`}>
          {variant === 'danger'  && <TrashIcon />}
          {variant === 'warning' && <WarnIcon />}
          {variant === 'info'    && <InfoIcon />}
        </div>

        {/* Text */}
        <div className="cm-body">
          <h3 className="cm-title" id="cm-title">{title}</h3>
          {message && <p className="cm-message">{message}</p>}
        </div>

        {/* Actions */}
        <div className="cm-actions">
          <button
            ref={cancelBtnRef}
            className="cm-btn cm-btn--cancel"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className={`cm-btn cm-btn--confirm cm-btn--${variant}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* Inline SVG icons */
const TrashIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const WarnIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const InfoIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
