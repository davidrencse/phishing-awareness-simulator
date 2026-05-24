import { Difficulty, Learner, ScenarioSummary } from '../types';
import StatusView from './StatusView';

interface ScenarioLibraryProps {
  learner: Learner | null;
  scenarios: ScenarioSummary[];
  loading: boolean;
  error: string | null;
  filters: { difficulty: '' | Difficulty; topic: string };
  onChangeFilters: (filters: { difficulty: '' | Difficulty; topic: string }) => void;
  onRetry: () => Promise<void> | void;
  onOpenScenario: (scenarioId: string) => void;
}

export default function ScenarioLibrary({
  learner,
  scenarios,
  loading,
  error,
  filters,
  onChangeFilters,
  onRetry,
  onOpenScenario,
}: ScenarioLibraryProps) {
  return (
    <section className="card stack" aria-labelledby="scenario-library-heading">
      <div className="row-between">
        <div>
          <h2 id="scenario-library-heading">Scenario library</h2>
          <p className="muted">Browse safe simulated phishing awareness scenarios. Completion status is requested from the backend when a learner profile exists.</p>
        </div>
        {!learner && <span className="badge incomplete">No learner profile</span>}
      </div>

      <div className="grid two-col">
        <div className="field">
          <label htmlFor="difficulty-filter">Difficulty</label>
          <select
            id="difficulty-filter"
            className="select"
            value={filters.difficulty}
            onChange={(event) => onChangeFilters({ ...filters, difficulty: event.target.value as '' | Difficulty })}
          >
            <option value="">All difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="topic-filter">Topic</label>
          <input
            id="topic-filter"
            className="input"
            value={filters.topic}
            onChange={(event) => onChangeFilters({ ...filters, topic: event.target.value })}
            placeholder="Filter by topic, such as urgency or links"
          />
        </div>
      </div>

      {loading && <StatusView kind="info" title="Loading scenarios" message="Fetching scenario summaries from the backend." />}
      {!loading && error && <StatusView kind="error" title="Could not load scenarios" message={error} actionLabel="Retry" onAction={onRetry} />}
      {!loading && !error && scenarios.length === 0 && (
        <StatusView kind="warning" title="No scenarios found" message="No scenario records matched the current filters." actionLabel="Clear topic filter" onAction={() => onChangeFilters({ ...filters, topic: '' })} />
      )}

      {!loading && !error && scenarios.length > 0 && (
        <div className="list">
          {scenarios.map((scenario) => (
            <article className="list-item" key={scenario.id}>
              <div className="row-between">
                <div className="stack" style={{ gap: '0.45rem' }}>
                  <div className="row">
                    <span className={`badge ${scenario.difficulty}`}>{scenario.difficulty}</span>
                    <span className={`badge ${scenario.completed ? 'complete' : 'incomplete'}`}>
                      {scenario.completed ? 'Completed' : 'Not completed'}
                    </span>
                    <span className="badge">{scenario.estimatedMinutes} min</span>
                  </div>
                  <div>
                    <h3 style={{ margin: 0 }}>{scenario.title}</h3>
                    <p className="muted" style={{ margin: '0.4rem 0 0' }}>{scenario.summary}</p>
                  </div>
                  <div className="row">
                    {scenario.topics.map((topic) => (
                      <span className="badge" key={topic}>{topic}</span>
                    ))}
                  </div>
                </div>
                <button className="button primary" onClick={() => onOpenScenario(scenario.id)}>
                  Inspect scenario
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
