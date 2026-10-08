// Provides reusable form, table, status, and toast components.
import { useEffect, useState } from 'react';
import { useLibrary } from '../context/LibraryContext.jsx';

// These small pieces are shared by forms, tables, and messages.

export function PageHead({ eyebrow, title, children }) {
  return (
    <header className="page-head">
      <div>
        <p className="page-eyebrow">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
        <p className="page-desc">{children}</p>
      </div>
    </header>
  );
}

// Shows a field label, its input, and any error message.
export function Field({ label, htmlFor, error, style, children }) {
  return (
    <div className="field" style={style}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      <span className="field-error">{error || ''}</span>
    </div>
  );
}

export function TextSoft({ children }) {
  return <span className="text-soft">{children}</span>;
}

// Lets the user show or hide the password they typed.
export function PasswordInput({ id, value, onChange, placeholder, autoComplete = 'current-password', name = 'password' }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <input
        type={visible ? 'text' : 'password'}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="password-toggle"
        aria-label={visible ? 'Hide password' : 'Show password'}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}

export function Stamp({ tone = '', flat = true, children }) {
  return (
    <span className={`stamp${tone ? ` ${tone}` : ''}`} style={flat ? { transform: 'none' } : undefined}>
      {children}
    </span>
  );
}

export function TableWrap({ headers, children }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function EmptyRow({ colSpan, children }) {
  return (
    <tr className="empty-row">
      <td colSpan={colSpan}>{children}</td>
    </tr>
  );
}

// Shows a short message, then hides it after a moment.
export function Toast() {
  const { toast, clearToast } = useLibrary();
  const [showing, setShowing] = useState(false);

  useEffect(() => {
    if (!toast) return undefined;

    const raf = requestAnimationFrame(() => setShowing(true));
    const hideTimer = setTimeout(() => setShowing(false), 2600);
    const clearTimer = setTimeout(() => clearToast(), 2850);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(hideTimer);
      clearTimeout(clearTimer);
      setShowing(false);
    };
  }, [toast, clearToast]);

  if (!toast) return null;
  return <div className={`toast${showing ? ' show' : ''}`}>{toast.message}</div>;
}
