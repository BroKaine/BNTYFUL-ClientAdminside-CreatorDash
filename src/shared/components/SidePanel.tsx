import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface SidePanelProps {
  title: string;
  eyebrow: string;
  onClose(): void;
  children: ReactNode;
  footer?: ReactNode;
}

export function SidePanel({ title, eyebrow, onClose, children, footer }: SidePanelProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      returnFocus?.focus();
    };
  }, [onClose]);
  return (
    <div className="panel-layer" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section className="side-panel" role="dialog" aria-modal="true" aria-labelledby="panel-title">
        <header className="side-panel__header">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 id="panel-title">{title}</h2>
          </div>
          <button ref={closeRef} className="icon-button" type="button" onClick={onClose} aria-label="Close detail panel"><X /></button>
        </header>
        <div className="side-panel__body">{children}</div>
        {footer && <footer className="side-panel__footer">{footer}</footer>}
      </section>
    </div>
  );
}
