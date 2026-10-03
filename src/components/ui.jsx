import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import { STATUS } from '../logic/coverage.js';

/* ---------- Bố cục ---------- */

export function PageHeader({ title, children, actions }) {
  return (
    <header className="page-header">
      <h1>{title}</h1>
      {children && <p>{children}</p>}
      {actions && <div className="btn-row">{actions}</div>}
    </header>
  );
}

export function Section({ title, description, actions, children, id }) {
  const headingId = useId();
  return (
    <section className="section" aria-labelledby={headingId} id={id}>
      <div className="section-head">
        <div>
          <h2 id={headingId}>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {actions && <div className="btn-row">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="empty">
      <h2 className="empty-title">{title}</h2>
      {children && <p>{children}</p>}
      {action && <div className="btn-row">{action}</div>}
    </div>
  );
}

/* ---------- Form ---------- */

// Field gắn nhãn, gợi ý và lỗi vào đúng control qua id
export function Field({ label, hint, error, children, className = '' }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const control = typeof children === 'function'
    ? children({ id, 'aria-describedby': [hintId, errorId].filter(Boolean).join(' ') || undefined, 'aria-invalid': error ? true : undefined })
    : children;
  return (
    <div className={`field ${className}`}>
      <label className="field-label" htmlFor={id}>{label}</label>
      {control}
      {hint && <span className="field-hint" id={hintId}>{hint}</span>}
      {error && <span className="field-error" id={errorId}>{error}</span>}
    </div>
  );
}

/* ---------- Trạng thái ---------- */

const MARK_CLASS = { 'sach-rieng': 'mark-good', 'sach-chung': 'mark-warn', so: 'mark-digital', phieu: 'mark-bad' };

export function StatusMark({ status }) {
  const s = STATUS[status];
  return <span className={`mark ${MARK_CLASS[status]}`} data-glyph={s.mark}>{s.label}</span>;
}

export function Mark({ tone, glyph, children }) {
  return <span className={`mark mark-${tone}`} data-glyph={glyph}>{children}</span>;
}

/* ---------- Dialog xác nhận (thay window.confirm) ---------- */

const ConfirmCtx = createContext(null);

export function ConfirmProvider({ children }) {
  const [req, setReq] = useState(null);
  const ref = useRef(null);
  const headingId = useId();

  const confirm = useCallback((options) => new Promise((resolve) => setReq({ ...options, resolve })), []);

  useEffect(() => {
    const el = ref.current;
    if (req && el && !el.open) el.showModal();
  }, [req]);

  const close = (result) => {
    ref.current?.close();
    req?.resolve(result);
    setReq(null);
  };

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {req && (
        <dialog
          ref={ref}
          className="dialog"
          aria-labelledby={headingId}
          onCancel={(e) => { e.preventDefault(); close(false); }}
          onClick={(e) => { if (e.target === e.currentTarget) close(false); }}
        >
          <div className="dialog-body">
            <h2 id={headingId}>{req.title}</h2>
            {req.body && <p className="muted">{req.body}</p>}
            <div className="dialog-actions">
              <button className="btn" onClick={() => close(false)} autoFocus>Huỷ</button>
              <button className={`btn ${req.danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => close(true)}>
                {req.confirmLabel}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </ConfirmCtx.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmCtx);

/* ---------- Dialog nội dung ---------- */

export function Dialog({ title, onClose, children }) {
  const ref = useRef(null);
  const headingId = useId();
  useEffect(() => { ref.current?.showModal(); }, []);
  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={headingId}
      onClose={onClose}
      onClick={(e) => { if (e.target === e.currentTarget) ref.current.close(); }}
    >
      <div className="dialog-body">
        <h2 id={headingId}>{title}</h2>
        {children}
        <div className="dialog-actions">
          <button className="btn" onClick={() => ref.current.close()}>Đóng</button>
        </div>
      </div>
    </dialog>
  );
}

/* ---------- Toast có hoàn tác ---------- */

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);

  const show = useCallback((message, action) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-2), { id, message, action }]);
    timers.current.set(id, setTimeout(() => dismiss(id), action ? 7000 : 4000));
  }, [dismiss]);

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <span>{t.message}</span>
            {t.action && (
              <button className="btn btn-sm" onClick={() => { t.action.onClick(); dismiss(t.id); }}>{t.action.label}</button>
            )}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
