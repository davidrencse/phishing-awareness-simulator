import { FormEvent, useMemo, useState } from 'react';
import { Learner } from '../types';
import StatusView from './StatusView';

interface AuthPanelProps {
  learner: Learner | null;
  loading: boolean;
  error: string | null;
  onCreateLearner: (displayName: string) => Promise<void>;
  onClearLearner: () => void;
}

export default function AuthPanel({ learner, loading, error, onCreateLearner, onClearLearner }: AuthPanelProps) {
  const [displayName, setDisplayName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const createdAt = useMemo(() => {
    if (!learner) return null;
    return new Date(learner.createdAt).toLocaleString();
  }, [learner]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = displayName.trim();
    if (trimmed.length > 60) {
      setValidationError('Display name must be 60 characters or fewer.');
      return;
    }
    setValidationError(null);
    await onCreateLearner(trimmed);
    setDisplayName('');
  };

  return (
    <section className="card stack" aria-labelledby="learner-profile-heading">
      <div className="row-between">
        <div>
          <h2 id="learner-profile-heading">Anonymous learner profile</h2>
          <p className="muted">
            Progress tracking uses a backend-generated learner ID. No passwords, tokens, or sensitive personal data are stored here.
          </p>
        </div>
        {learner && (
          <button className="button" onClick={onClearLearner}>
            Sign out profile
          </button>
        )}
      </div>

      {!learner ? (
        <form className="grid two-col" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="displayName">Display name</label>
            <input
              id="displayName"
              className="input"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={60}
              placeholder="Optional name for this device"
            />
          </div>
          <div className="row" style={{ alignSelf: 'end' }}>
            <button type="submit" className="button primary" disabled={loading}>
              {loading ? 'Creating profile...' : 'Create learner profile'}
            </button>
          </div>
          {(validationError || error) && (
            <div className="two-col" style={{ gridColumn: '1 / -1' }}>
              <StatusView kind="error" title="Profile creation failed" message={validationError || error || ''} />
            </div>
          )}
        </form>
      ) : (
        <div className="grid two-col">
          <div className="metric">
            <span className="muted">Learner ID</span>
            <strong style={{ fontSize: '1rem', wordBreak: 'break-all' }}>{learner.id}</strong>
          </div>
          <div className="metric">
            <span className="muted">Created</span>
            <strong style={{ fontSize: '1rem' }}>{createdAt}</strong>
          </div>
        </div>
      )}
    </section>
  );
}
