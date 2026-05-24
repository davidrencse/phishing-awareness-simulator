import { Resource, ResourceCategory } from '../types';
import StatusView from './StatusView';

interface ResourceCenterProps {
  resources: Resource[];
  loading: boolean;
  error: string | null;
  filters: { category: '' | ResourceCategory; topic: string };
  onChangeFilters: (filters: { category: '' | ResourceCategory; topic: string }) => void;
  onRetry: () => Promise<void> | void;
}

export default function ResourceCenter({ resources, loading, error, filters, onChangeFilters, onRetry }: ResourceCenterProps) {
  return (
    <section className="card stack" aria-labelledby="resource-center-heading">
      <div>
        <h2 id="resource-center-heading">Defensive resource center</h2>
        <p className="muted">Load curated anti-phishing guidance, training references, tools, and reporting resources from the backend.</p>
      </div>

      <div className="grid two-col">
        <div className="field">
          <label htmlFor="resource-category">Category</label>
          <select
            id="resource-category"
            className="select"
            value={filters.category}
            onChange={(event) => onChangeFilters({ ...filters, category: event.target.value as '' | ResourceCategory })}
          >
            <option value="">All categories</option>
            <option value="reporting">Reporting</option>
            <option value="prevention">Prevention</option>
            <option value="training">Training</option>
            <option value="tools">Tools</option>
            <option value="guidelines">Guidelines</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="resource-topic">Topic</label>
          <input
            id="resource-topic"
            className="input"
            value={filters.topic}
            onChange={(event) => onChangeFilters({ ...filters, topic: event.target.value })}
            placeholder="Filter by topic"
          />
        </div>
      </div>

      {loading && <StatusView kind="info" title="Loading resources" message="Fetching defensive resources from the backend." />}
      {!loading && error && <StatusView kind="error" title="Could not load resources" message={error} actionLabel="Retry" onAction={onRetry} />}
      {!loading && !error && resources.length === 0 && (
        <StatusView kind="warning" title="No resources found" message="No resources matched the current filters." />
      )}

      {!loading && !error && resources.length > 0 && (
        <div className="list">
          {resources.map((resource) => (
            <article className="list-item" key={resource.id}>
              <div className="stack" style={{ gap: '0.5rem' }}>
                <div className="row-between">
                  <strong>{resource.title}</strong>
                  <span className="badge">{resource.category}</span>
                </div>
                <div>{resource.description}</div>
                <div className="row">
                  {resource.topics.map((topic) => (
                    <span className="badge" key={topic}>{topic}</span>
                  ))}
                </div>
                <div className="row-between">
                  <span className="muted">Source: {resource.sourceName}</span>
                  <a className="button" href={resource.url} target="_blank" rel="noreferrer noopener">
                    Open resource
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
