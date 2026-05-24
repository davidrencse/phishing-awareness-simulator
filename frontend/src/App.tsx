import { useEffect, useMemo, useState } from 'react';
import { createLearner } from './api/authApi';
import { getProgress, resetProgress } from './api/progressApi';
import { getScenarioDetail, listScenarios, submitQuiz } from './api/scenarioApi';
import { listResources } from './api/resourceApi';
import Header from './components/Header';
import AuthPanel from './components/AuthPanel';
import Dashboard from './components/Dashboard';
import FeedbackPanel from './components/FeedbackPanel';
import ResourceCenter from './components/ResourceCenter';
import ScenarioInspector from './components/ScenarioInspector';
import ScenarioLibrary from './components/ScenarioLibrary';
import StatusView from './components/StatusView';
import {
  ApiErrorShape,
  Difficulty,
  Learner,
  ProgressSummary,
  QuizAnswerInput,
  QuizSubmissionResponse,
  Resource,
  ResourceCategory,
  ScenarioDetail,
  ScenarioSummary,
  ViewName,
} from './types';

const STORAGE_KEY = 'phishing-awareness-learner';

type RouteState =
  | { name: 'home' }
  | { name: 'scenarios' }
  | { name: 'scenario'; scenarioId: string }
  | { name: 'dashboard' }
  | { name: 'resources' };

interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

const defaultScenarioListState: AsyncState<ScenarioSummary[]> = {
  data: [],
  loading: false,
  error: null,
};

const defaultResourcesState: AsyncState<Resource[]> = {
  data: [],
  loading: false,
  error: null,
};

const defaultProgressState: AsyncState<ProgressSummary | null> = {
  data: null,
  loading: false,
  error: null,
};

function parseRoute(): RouteState {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  if (hash === '/' || hash === '') return { name: 'home' };
  if (hash === '/scenarios') return { name: 'scenarios' };
  if (hash.startsWith('/scenarios/')) {
    const parts = hash.split('/').filter(Boolean);
    if (parts.length >= 2) {
      return { name: 'scenario', scenarioId: decodeURIComponent(parts[1]) };
    }
  }
  if (hash === '/dashboard') return { name: 'dashboard' };
  if (hash === '/resources') return { name: 'resources' };
  return { name: 'home' };
}

function setRoute(route: RouteState) {
  let hash = '/';
  if (route.name === 'scenarios') hash = '/scenarios';
  if (route.name === 'scenario') hash = `/scenarios/${encodeURIComponent(route.scenarioId)}`;
  if (route.name === 'dashboard') hash = '/dashboard';
  if (route.name === 'resources') hash = '/resources';
  window.location.hash = hash;
}

function getStoredLearner(): Learner | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Learner;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function storeLearner(learner: Learner | null) {
  if (!learner) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(learner));
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const maybe = error as ApiErrorShape;
    if (maybe.error?.message) return maybe.error.message;
  }
  return 'Something went wrong while contacting the API.';
}

export default function App() {
  const [route, setRouteState] = useState<RouteState>(parseRoute());
  const [learner, setLearner] = useState<Learner | null>(() => getStoredLearner());
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [apiHealthError, setApiHealthError] = useState<string | null>(null);

  const [scenarioFilters, setScenarioFilters] = useState<{ difficulty: '' | Difficulty; topic: string }>({
    difficulty: '',
    topic: '',
  });
  const [scenarioState, setScenarioState] = useState<AsyncState<ScenarioSummary[]>>(defaultScenarioListState);
  const [selectedScenario, setSelectedScenario] = useState<AsyncState<ScenarioDetail | null>>({
    data: null,
    loading: false,
    error: null,
  });
  const [selectedIndicatorIds, setSelectedIndicatorIds] = useState<string[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<QuizSubmissionResponse | null>(null);

  const [progressState, setProgressState] = useState<AsyncState<ProgressSummary | null>>(defaultProgressState);
  const [resettingProgress, setResettingProgress] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const [resourceFilters, setResourceFilters] = useState<{ category: '' | ResourceCategory; topic: string }>({
    category: '',
    topic: '',
  });
  const [resourceState, setResourceState] = useState<AsyncState<Resource[]>>(defaultResourcesState);

  useEffect(() => {
    const onHashChange = () => setRouteState(parseRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    storeLearner(learner);
  }, [learner]);

  const loadScenarios = async () => {
    setScenarioState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await listScenarios({
        difficulty: scenarioFilters.difficulty || undefined,
        topic: scenarioFilters.topic || undefined,
        learnerId: learner?.id,
      });
      setScenarioState({ data: response.scenarios, loading: false, error: null });
      setApiHealthError(null);
    } catch (error) {
      setScenarioState({ data: [], loading: false, error: getErrorMessage(error) });
      setApiHealthError(getErrorMessage(error));
    }
  };

  const loadScenarioDetail = async (scenarioId: string) => {
    setSelectedScenario({ data: null, loading: true, error: null });
    setSelectedIndicatorIds([]);
    setQuizAnswers({});
    setQuizError(null);
    setQuizResult(null);
    try {
      const response = await getScenarioDetail(scenarioId);
      setSelectedScenario({ data: response.scenario, loading: false, error: null });
      setApiHealthError(null);
    } catch (error) {
      setSelectedScenario({ data: null, loading: false, error: getErrorMessage(error) });
      setApiHealthError(getErrorMessage(error));
    }
  };

  const loadProgress = async () => {
    if (!learner) {
      setProgressState({ data: null, loading: false, error: 'Create a learner profile to track progress.' });
      return;
    }
    setProgressState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await getProgress(learner.id);
      setProgressState({ data: response.progress, loading: false, error: null });
      setApiHealthError(null);
    } catch (error) {
      setProgressState({ data: null, loading: false, error: getErrorMessage(error) });
      setApiHealthError(getErrorMessage(error));
    }
  };

  const loadResources = async () => {
    setResourceState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await listResources({
        category: resourceFilters.category || undefined,
        topic: resourceFilters.topic || undefined,
      });
      setResourceState({ data: response.resources, loading: false, error: null });
      setApiHealthError(null);
    } catch (error) {
      setResourceState({ data: [], loading: false, error: getErrorMessage(error) });
      setApiHealthError(getErrorMessage(error));
    }
  };

  useEffect(() => {
    if (route.name === 'scenarios') {
      void loadScenarios();
    }
  }, [route.name, scenarioFilters.difficulty, scenarioFilters.topic, learner?.id]);

  useEffect(() => {
    if (route.name === 'scenario') {
      void loadScenarioDetail(route.scenarioId);
    }
  }, [route]);

  useEffect(() => {
    if (route.name === 'dashboard') {
      void loadProgress();
    }
  }, [route.name, learner?.id]);

  useEffect(() => {
    if (route.name === 'resources') {
      void loadResources();
    }
  }, [route.name, resourceFilters.category, resourceFilters.topic]);

  const createAnonymousLearner = async (displayName: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const response = await createLearner({ displayName: displayName.trim() || undefined });
      setLearner(response.learner);
      setApiHealthError(null);
    } catch (error) {
      setAuthError(getErrorMessage(error));
      setApiHealthError(getErrorMessage(error));
    } finally {
      setAuthLoading(false);
    }
  };

  const submitScenarioQuiz = async () => {
    if (!learner) {
      setQuizError('Create a learner profile before submitting a quiz.');
      return;
    }
    if (!selectedScenario.data) {
      setQuizError('Load a scenario before submitting answers.');
      return;
    }

    const questions = selectedScenario.data.quiz.questions;
    const unanswered = questions.some((question) => !quizAnswers[question.id]);
    if (unanswered) {
      setQuizError('Answer every question before submitting the attempt.');
      return;
    }

    const answers: QuizAnswerInput[] = questions.map((question) => ({
      questionId: question.id,
      optionId: quizAnswers[question.id],
    }));

    setQuizSubmitting(true);
    setQuizError(null);
    try {
      const response = await submitQuiz(selectedScenario.data.id, {
        learnerId: learner.id,
        answers,
      });
      setQuizResult(response);
      setApiHealthError(null);
      await Promise.allSettled([loadScenarios(), loadProgress()]);
    } catch (error) {
      setQuizError(getErrorMessage(error));
      setApiHealthError(getErrorMessage(error));
    } finally {
      setQuizSubmitting(false);
    }
  };

  const handleResetProgress = async () => {
    if (!learner) return;
    const confirmed = window.confirm(
      'Reset all recorded quiz submissions and dashboard progress for this learner profile?'
    );
    if (!confirmed) return;

    setResettingProgress(true);
    setResetError(null);
    try {
      await resetProgress(learner.id);
      setQuizResult(null);
      await Promise.allSettled([loadProgress(), loadScenarios()]);
      if (route.name === 'scenario' && selectedScenario.data?.id) {
        await loadScenarioDetail(selectedScenario.data.id);
      }
      setApiHealthError(null);
    } catch (error) {
      setResetError(getErrorMessage(error));
      setApiHealthError(getErrorMessage(error));
    } finally {
      setResettingProgress(false);
    }
  };

  const recommendedScenarios = useMemo(() => {
    if (!scenarioState.data.length || !progressState.data?.recommendedScenarioIds?.length) return [];
    const ids = new Set(progressState.data.recommendedScenarioIds);
    return scenarioState.data.filter((scenario) => ids.has(scenario.id));
  }, [scenarioState.data, progressState.data]);

  const currentView: ViewName = route.name;

  return (
    <div className="app-shell">
      <Header
        currentView={currentView}
        learner={learner}
        onNavigate={(view) => {
          if (view === 'home') setRoute({ name: 'home' });
          if (view === 'scenarios') setRoute({ name: 'scenarios' });
          if (view === 'dashboard') setRoute({ name: 'dashboard' });
          if (view === 'resources') setRoute({ name: 'resources' });
        }}
      />

      <main className="container app-main">
        <section className="hero-card">
          <p className="eyebrow">Safe security training</p>
          <h1>Phishing Awareness Simulator</h1>
          <p className="lead">
            All messages, links, and quizzes in this application are simulated for education only.
            Nothing here sends real email, captures credentials, or opens phishing destinations.
          </p>
          <div className="hero-actions">
            <button className="button primary" onClick={() => setRoute({ name: 'scenarios' })}>
              Browse scenarios
            </button>
            <button className="button" onClick={() => setRoute({ name: 'dashboard' })}>
              View dashboard
            </button>
            <button className="button" onClick={() => setRoute({ name: 'resources' })}>
              Explore resources
            </button>
          </div>
        </section>

        <AuthPanel
          learner={learner}
          loading={authLoading}
          error={authError}
          onCreateLearner={createAnonymousLearner}
          onClearLearner={() => {
            setLearner(null);
            setProgressState(defaultProgressState);
            setQuizResult(null);
            setAuthError(null);
          }}
        />

        {apiHealthError && (
          <StatusView
            kind="error"
            title="Backend connection issue"
            message={apiHealthError}
            actionLabel="Retry current view"
            onAction={() => {
              if (route.name === 'scenarios') void loadScenarios();
              if (route.name === 'scenario') void loadScenarioDetail(route.scenarioId);
              if (route.name === 'dashboard') void loadProgress();
              if (route.name === 'resources') void loadResources();
            }}
          />
        )}

        {route.name === 'home' && (
          <section className="grid two-col">
            <StatusView
              kind="info"
              title="Scenario inspection workflow"
              message="Open a scenario, inspect the simulated message, select suspicious indicators, answer the quiz, and review feedback returned by the backend."
            />
            <StatusView
              kind="info"
              title="Progress workflow"
              message="Your anonymous learner profile lets the backend persist completion rate, average score, recent attempts, and recommended next scenarios."
            />
          </section>
        )}

        {route.name === 'scenarios' && (
          <ScenarioLibrary
            learner={learner}
            scenarios={scenarioState.data}
            loading={scenarioState.loading}
            error={scenarioState.error}
            filters={scenarioFilters}
            onChangeFilters={setScenarioFilters}
            onRetry={loadScenarios}
            onOpenScenario={(scenarioId) => setRoute({ name: 'scenario', scenarioId })}
          />
        )}

        {route.name === 'scenario' && (
          <>
            <ScenarioInspector
              learner={learner}
              scenario={selectedScenario.data}
              loading={selectedScenario.loading}
              error={selectedScenario.error}
              selectedIndicatorIds={selectedIndicatorIds}
              quizAnswers={quizAnswers}
              quizSubmitting={quizSubmitting}
              quizError={quizError}
              quizResult={quizResult}
              onRetry={() => loadScenarioDetail(route.scenarioId)}
              onToggleIndicator={(indicatorId) => {
                setSelectedIndicatorIds((prev) =>
                  prev.includes(indicatorId)
                    ? prev.filter((id) => id !== indicatorId)
                    : [...prev, indicatorId]
                );
              }}
              onAnswerChange={(questionId, optionId) => {
                setQuizAnswers((prev) => ({ ...prev, [questionId]: optionId }));
              }}
              onSubmitQuiz={submitScenarioQuiz}
              onGoToDashboard={() => setRoute({ name: 'dashboard' })}
              onBrowseScenarios={() => setRoute({ name: 'scenarios' })}
            />
            <FeedbackPanel
              result={quizResult}
              scenario={selectedScenario.data}
              onOpenRecommendedScenario={(scenarioId) => setRoute({ name: 'scenario', scenarioId })}
            />
          </>
        )}

        {route.name === 'dashboard' && (
          <Dashboard
            learner={learner}
            progress={progressState.data}
            loading={progressState.loading}
            error={progressState.error}
            resetting={resettingProgress}
            resetError={resetError}
            recommendedScenarios={recommendedScenarios}
            onRetry={loadProgress}
            onResetProgress={handleResetProgress}
            onBrowseScenarios={() => setRoute({ name: 'scenarios' })}
            onOpenScenario={(scenarioId) => setRoute({ name: 'scenario', scenarioId })}
          />
        )}

        {route.name === 'resources' && (
          <ResourceCenter
            resources={resourceState.data}
            loading={resourceState.loading}
            error={resourceState.error}
            filters={resourceFilters}
            onChangeFilters={setResourceFilters}
            onRetry={loadResources}
          />
        )}
      </main>
    </div>
  );
}
