import React, { useEffect, useRef } from 'react';
import Icon from './Icons.jsx';

export default function Sheet({ title, onClose, children, className = '' }) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const dialog = dialogRef.current;
    const focusable = () =>
      [
        ...dialog.querySelectorAll('button, input, textarea, select, a[href], [tabindex="0"]'),
      ].filter((element) => !element.disabled && element.getClientRects().length);
    (dialog.querySelector('[data-initial-focus]') || focusable()[0])?.focus();
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
      }
      if (event.key !== 'Tab') return;
      const elements = focusable();
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    dialog.addEventListener('keydown', handleKey);
    return () => {
      dialog.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  return (
    <div
      className={`sheet-mask ${className}`}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="sheet" role="dialog" aria-modal="true" aria-label={title} ref={dialogRef}>
        <div className="sheet-handle" aria-hidden="true" />
        <header className="sheet-header">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" aria-label={`关闭${title}`} onClick={onClose}>
            <Icon name="close" />
          </button>
        </header>
        <div className="sheet-content">{children}</div>
      </section>
    </div>
  );
}
