import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

export function Button({
  variant = 'primary',
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }) {
  return (
    <button className={`ui-button ui-button-${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }) {
  return <span className={`ui-badge ui-badge-${tone}`}>{children}</span>;
}

export function Card({ children, className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={`ui-card ${className}`.trim()} {...props}>{children}</section>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="empty-state"><strong>{title}</strong><span>{description}</span></div>;
}

export function EditDialog({
  title,
  description,
  children,
  onCancel,
  onSave,
  saveLabel = 'Save changes',
  saving = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onCancel: () => void;
  onSave: () => void;
  saveLabel?: string;
  saving?: boolean;
}) {
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onCancel}>
      <section
        className="edit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="edit-dialog-header">
          <div>
            <p className="eyebrow">Review changes</p>
            <h2 id="edit-dialog-title">{title}</h2>
            {description && <p className="page-description">{description}</p>}
          </div>
          <button type="button" className="dialog-close" aria-label="Cancel editing" onClick={onCancel}>×</button>
        </div>
        <div className="edit-dialog-body">{children}</div>
        <div className="edit-dialog-actions">
          <button type="button" className="ui-button ui-button-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
          <button type="button" className="ui-button ui-button-primary" onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : saveLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
