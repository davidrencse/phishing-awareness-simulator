import { apiRequest } from './client';
import { Difficulty, QuizAnswerInput, QuizSubmissionResponse, ScenarioDetail, ScenarioSummary } from '../types';

export function listScenarios(params: { difficulty?: Difficulty; topic?: string; learnerId?: string }) {
  return apiRequest<{ scenarios: ScenarioSummary[] }>('/api/scenarios', undefined, {
    difficulty: params.difficulty,
    topic: params.topic,
    learnerId: params.learnerId,
  });
}

export function getScenarioDetail(scenarioId: string) {
  return apiRequest<{ scenario: ScenarioDetail }>(`/api/scenarios/${encodeURIComponent(scenarioId)}`);
}

export function submitQuiz(scenarioId: string, payload: { learnerId: string; answers: QuizAnswerInput[] }) {
  return apiRequest<QuizSubmissionResponse>(`/api/scenarios/${encodeURIComponent(scenarioId)}/quiz-submissions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
