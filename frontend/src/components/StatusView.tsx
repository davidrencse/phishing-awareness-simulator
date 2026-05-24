interface StatusViewProps {
  kind: 'info' | 'error' | 'success' | 'warning';
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function StatusView({ kind, title, message, actionLabel, onAction }: StatusViewProps) {
  return (
    <div className={`status ${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <div className="stack" style={{ gap: '0.45rem' }}>
        <strong>{title}</strong>
        <span>{message}</span>
        {actionLabel && onAction && (
          <div>
            <button className="button" onClick={onAction}>{actionLabel}</button>
          </div>
        )}
      </div>
    </div>
  );
}
