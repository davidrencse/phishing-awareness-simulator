import { Learner, QuizSubmissionResponse, ScenarioDetail } from '../types';
import StatusView from './StatusView';

interface ScenarioInspectorProps {
  learner: Learner | null;
  scenario: ScenarioDetail | null;
  loading: boolean;
  error: string | null;
  selectedIndicatorIds: string[];
  quizAnswers: Record<string, string>;
  quizSubmitting: boolean;
  quizError: string | null;
  quizResult: QuizSubmissionResponse | null;
  onRetry: () => Promise<void> | void;
  onToggleIndicator: (indicatorId: string) => void;
  onAnswerChange: (questionId: string, optionId: string) => void;
  onSubmitQuiz: () => Promise<void> | void;
  onGoToDashboard: () => void;
  onBrowseScenarios: () => void;
}

export default function ScenarioInspector({
  learner,
  scenario,
  loading,
  error,
  selectedIndicatorIds,
  quizAnswers,
  quizSubmitting,
  quizError,
  quizResult,
  onRetry,
  onToggleIndicator,
  onAnswerChange,
  onSubmitQuiz,
  onGoToDashboard,
  onBrowseScenarios,
}: ScenarioInspectorProps) {
  return (
    <section className="card stack" aria-labelledby="scenario-inspector-heading">
      <div className="row-between">
        <div>
          <h2 id="scenario-inspector-heading">Scenario inspector</h2>
          <p className="muted">Review the simulated message, select suspicious indicators, and submit your quiz attempt to the backend.</p>
        </div>
        <div className="row">
          <button className="button" onClick={onBrowseScenarios}>Back to library</button>
          <button className="button" onClick={onGoToDashboard}>Open dashboard</button>
        </div>
      </div>

      {loading && <StatusView kind="info" title="Loading scenario" message="Fetching scenario content and quiz metadata from the backend." />}
      {!loading && error && <StatusView kind="error" title="Could not load scenario" message={error} actionLabel="Retry" onAction={onRetry} />}

      {!loading && !error && scenario && (
        <div className="stack">
          <div className="row-between">
            <div>
              <h3 style={{ margin: 0 }}>{scenario.title}</h3>
              <p className="muted" style={{ margin: '0.4rem 0 0' }}>{scenario.summary}</p>
            </div>
            <div className="row">
              <span className={`badge ${scenario.difficulty}`}>{scenario.difficulty}</span>
              <span className="badge">{scenario.estimatedMinutes} min</span>
            </div>
          </div>

          <div className="row">
            {scenario.topics.map((topic) => (
              <span className="badge" key={topic}>{topic}</span>
            ))}
          </div>

          <div className="message-viewer">
            <div className="message-banner">Simulated content only — links are inert and non-clickable.</div>
            <div className="message-content">
              <div className="grid two-col">
                <div className="field">
                  <label>Channel</label>
                  <div className="input">{scenario.simulatedMessage.channel}</div>
                </div>
                <div className="field">
                  <label>From</label>
                  <div className="input">{scenario.simulatedMessage.fromLabel}</div>
                </div>
              </div>
              <div className="field">
                <label>Subject</label>
                <div className="input">{scenario.simulatedMessage.subject}</div>
              </div>
              <div className="field">
                <label>Message body</label>
                <div className="message-box">{scenario.simulatedMessage.body}</div>
              </div>
              <div className="grid two-col">
                <div className="field">
                  <label>Displayed links</label>
                  <div className="list">
                    {scenario.simulatedMessage.displayedLinks.length === 0 ? (
                      <div className="list-item muted">No links shown.</div>
                    ) : (
                      scenario.simulatedMessage.displayedLinks.map((link) => (
                        <div className="list-item" key={`${link.label}-${link.safeDisplayUrl}`}>
                          <strong>{link.label}</strong>
                          <div className="muted">{link.safeDisplayUrl}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="field">
                  <label>Attachments</label>
                  <div className="list">
                    {scenario.simulatedMessage.attachments.length === 0 ? (
                      <div className="list-item muted">No attachments shown.</div>
                    ) : (
                      scenario.simulatedMessage.attachments.map((attachment) => (
                        <div className="list-item" key={attachment.fileName}>
                          <strong>{attachment.fileName}</strong>
                          <div className="muted">{attachment.description}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card stack">
            <div>
              <h3>Red-flag selection workflow</h3>
              <p className="muted">Select the indicators you notice before submitting your quiz. This helps you inspect the scenario actively, even though scoring is based on the backend quiz response.</p>
            </div>
            <div className="list">
              {scenario.indicators.map((indicator) => {
                const selected = selectedIndicatorIds.includes(indicator.id);
                return (
                  <button
                    key={indicator.id}
                    className={`option-card ${selected ? 'selected' : ''}`}
                    onClick={() => onToggleIndicator(indicator.id)}
                    aria-pressed={selected}
                  >
                    <div className="row-between">
                      <strong>{indicator.label}</strong>
                      <span className={`badge ${indicator.severity}`}>{indicator.severity}</span>
                    </div>
                    <div className="muted">{indicator.description}</div>
                    <div className="muted">Topic: {indicator.topic}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card stack">
            <div>
              <h3>Quiz attempt</h3>
              <p className="muted">
                {learner
                  ? 'Answer every question and submit once ready. Evaluation, score, and explanations come from the backend.'
                  : 'Create a learner profile before submitting a quiz attempt.'}
              </p>
            </div>

            <div className="list">
              {scenario.quiz.questions.map((question, index) => (
                <div className="list-item" key={question.id}>
                  <div className="stack" style={{ gap: '0.5rem' }}>
                    <div>
                      <strong>Question {index + 1}</strong>
                      <div>{question.prompt}</div>
                      <div className="muted">Topic: {question.topic}</div>
                    </div>
                    <div className="list">
                      {question.options.map((option) => {
                        const checked = quizAnswers[question.id] === option.id;
                        return (
                          <label className={`option-card ${checked ? 'selected' : ''}`} key={option.id}>
                            <input
                              type="radio"
                              name={question.id}
                              checked={checked}
                              onChange={() => onAnswerChange(question.id, option.id)}
                            />{' '}
                            {option.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {quizError && <StatusView kind="error" title="Quiz submission failed" message={quizError} />}

            {!quizResult ? (
              <button className="button primary" disabled={quizSubmitting || !learner} onClick={onSubmitQuiz}>
                {quizSubmitting ? 'Submitting attempt...' : 'Submit attempt'}
              </button>
            ) : (
              <StatusView
                kind={quizResult.submission.passed ? 'success' : 'warning'}
                title={quizResult.submission.passed ? 'Attempt submitted successfully' : 'Attempt submitted — review feedback'}
                message={`Score: ${quizResult.submission.scorePercent}% · Correct ${quizResult.submission.correctCount} of ${quizResult.submission.totalQuestions}.`}
                actionLabel="Open dashboard"
                onAction={onGoToDashboard}
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}
