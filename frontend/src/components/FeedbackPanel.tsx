import { QuizSubmissionResponse, ScenarioDetail } from '../types';
import StatusView from './StatusView';

interface FeedbackPanelProps {
  result: QuizSubmissionResponse | null;
  scenario: ScenarioDetail | null;
  onOpenRecommendedScenario: (scenarioId: string) => void;
}

export default function FeedbackPanel({ result, scenario, onOpenRecommendedScenario }: FeedbackPanelProps) {
  if (!scenario) return null;

  return (
    <section className="card stack" aria-labelledby="feedback-panel-heading">
      <div>
        <h2 id="feedback-panel-heading">Feedback and learning review</h2>
        <p className="muted">Per-question correctness, explanations, weak topics, and recommendations are shown after the backend evaluates your submission.</p>
      </div>

      {!result && (
        <StatusView kind="info" title="No feedback yet" message="Submit the quiz attempt above to receive educational feedback from the backend." />
      )}

      {result && (
        <div className="stack">
          <div className="grid three-col">
            <div className="metric">
              <span className="muted">Score</span>
              <strong>{result.submission.scorePercent}%</strong>
            </div>
            <div className="metric">
              <span className="muted">Correct answers</span>
              <strong>{result.submission.correctCount} / {result.submission.totalQuestions}</strong>
            </div>
            <div className="metric">
              <span className="muted">Submitted</span>
              <strong style={{ fontSize: '1rem' }}>{new Date(result.submission.submittedAt).toLocaleString()}</strong>
            </div>
          </div>

          <div className="list">
            {scenario.quiz.questions.map((question) => {
              const feedback = result.feedback.find((item) => item.questionId === question.id);
              const selectedLabel = question.options.find((option) => option.id === feedback?.selectedOptionId)?.label || 'Not found';
              const correctLabel = question.options.find((option) => option.id === feedback?.correctOptionId)?.label || 'Not found';
              return (
                <div className={`list-item question-card ${feedback?.isCorrect ? 'correct' : 'incorrect'}`} key={question.id}>
                  <strong>{question.prompt}</strong>
                  <div className="muted">Your answer: {selectedLabel}</div>
                  <div className="muted">Correct answer: {correctLabel}</div>
                  <div>{feedback?.explanation}</div>
                  <div className="muted">Topic: {feedback?.topic || question.topic}</div>
                </div>
              );
            })}
          </div>

          <div className="grid two-col">
            <div className="card stack">
              <h3>Weak topics</h3>
              {result.weakTopics.length === 0 ? (
                <StatusView kind="success" title="No weak topics reported" message="The backend did not flag any topic weakness for this attempt." />
              ) : (
                <div className="row">
                  {result.weakTopics.map((topic) => (
                    <span className="badge" key={topic}>{topic}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="card stack">
              <h3>Recommended next scenarios</h3>
              {result.recommendedScenarioIds.length === 0 ? (
                <StatusView kind="info" title="No recommendations returned" message="The backend did not return additional scenarios for this attempt." />
              ) : (
                <div className="list">
                  {result.recommendedScenarioIds.map((scenarioId) => (
                    <div className="list-item row-between" key={scenarioId}>
                      <span>{scenarioId}</span>
                      <button className="button" onClick={() => onOpenRecommendedScenario(scenarioId)}>
                        Open
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
