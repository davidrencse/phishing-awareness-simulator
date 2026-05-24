import { Learner, ProgressSummary, ScenarioSummary } from '../types';
import StatusView from './StatusView';

interface DashboardProps {
  learner: Learner | null;
  progress: ProgressSummary | null;
  loading: boolean;
  error: string | null;
  resetting: boolean;
  resetError: string | null;
  recommendedScenarios: ScenarioSummary[];
  onRetry: () => Promise<void> | void;
  onResetProgress: () => Promise<void> | void;
  onBrowseScenarios: () => void;
  onOpenScenario: (scenarioId: string) => void;
}

export default function Dashboard({
  learner,
  progress,
  loading,
  error,
  resetting,
  resetError,
  recommendedScenarios,
  onRetry,
  onResetProgress,
  onBrowseScenarios,
  onOpenScenario,
}: DashboardProps) {
  return (
    <section className="card stack" aria-labelledby="dashboard-heading">
      <div className="row-between">
        <div>
          <h2 id="dashboard-heading">Training dashboard</h2>
          <p className="muted">Review completion rate, average score, topic performance, recent activity, and adaptive recommendations.</p>
        </div>
        <div className="row">
          <button className="button" onClick={onBrowseScenarios}>Browse scenarios</button>
          {learner && (
            <button className="button danger" onClick={onResetProgress} disabled={resetting}>
              {resetting ? 'Resetting...' : 'Reset progress'}
            </button>
          )}
        </div>
      </div>

      {!learner && (
        <StatusView kind="warning" title="No learner profile" message="Create an anonymous learner profile to load dashboard progress from the backend." />
      )}

      {resetError && <StatusView kind="error" title="Reset failed" message={resetError} />}

      {loading && <StatusView kind="info" title="Loading progress" message="Fetching learner progress from the backend." />}

      {!loading && error && <StatusView kind="error" title="Could not load dashboard" message={error} actionLabel="Retry" onAction={onRetry} />}

      {!loading && !error && progress && (
        <div className="stack">
          <div className="grid three-col">
            <div className="metric">
              <span className="muted">Completion</span>
              <strong>{progress.completionPercent}%</strong>
              <div className="progress-bar"><span style={{ width: `${progress.completionPercent}%` }} /></div>
            </div>
            <div className="metric">
              <span className="muted">Completed scenarios</span>
              <strong>{progress.completedScenarios} / {progress.totalScenarios}</strong>
            </div>
            <div className="metric">
              <span className="muted">Average score</span>
              <strong>{progress.averageScorePercent}%</strong>
            </div>
          </div>

          <div className="grid two-col">
            <div className="card stack">
              <h3>Topic performance</h3>
              {progress.topicPerformance.length === 0 ? (
                <StatusView kind="warning" title="No topic data yet" message="Complete at least one quiz to see strengths and weak areas." />
              ) : (
                <div className="list">
                  {progress.topicPerformance.map((topic) => (
                    <div key={topic.topic} className="topic-bar">
                      <div className="row-between">
                        <strong>{topic.topic}</strong>
                        <span className="muted">{topic.scorePercent}% · {topic.correctCount}/{topic.attemptCount} correct</span>
                      </div>
                      <div className="fill"><span style={{ width: `${topic.scorePercent}%` }} /></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card stack">
              <h3>Recent activity</h3>
              {progress.recentActivity.length === 0 ? (
                <StatusView kind="warning" title="No attempts yet" message="Quiz submissions will appear here after you complete a scenario." />
              ) : (
                <div className="list">
                  {progress.recentActivity.map((activity) => (
                    <div className="list-item" key={activity.submissionId}>
                      <div className="row-between">
                        <strong>{activity.scenarioTitle}</strong>
                        <span className="badge">{activity.scorePercent}%</span>
                      </div>
                      <div className="muted">Submitted {new Date(activity.submittedAt).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card stack">
            <h3>Recommended next scenarios</h3>
            {recommendedScenarios.length === 0 ? (
              <StatusView kind="info" title="No recommendations yet" message="Recommendations will appear after the backend evaluates quiz performance and weak topics." />
            ) : (
              <div className="list">
                {recommendedScenarios.map((scenario) => (
                  <div className="list-item" key={scenario.id}>
                    <div className="row-between">
                      <div>
                        <strong>{scenario.title}</strong>
                        <div className="muted">{scenario.summary}</div>
                      </div>
                      <button className="button primary" onClick={() => onOpenScenario(scenario.id)}>
                        Open scenario
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && !error && learner && !progress && (
        <StatusView kind="warning" title="No progress returned" message="The backend did not return a progress summary for this learner yet." actionLabel="Retry" onAction={onRetry} />
      )}
    </section>
  );
}
