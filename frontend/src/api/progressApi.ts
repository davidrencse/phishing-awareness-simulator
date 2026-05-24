import { apiRequest } from './client';
import { ProgressSummary } from '../types';

export function getProgress(learnerId: string) {
  return apiRequest<{ progress: ProgressSummary }>(`/api/learners/${encodeURIComponent(learnerId)}/progress`);
}

export function resetProgress(learnerId: string) {
  return apiRequest<{ success: boolean; learnerId: string; deletedSubmissionCount: number }>(
    `/api/learners/${encodeURIComponent(learnerId)}/progress`,
    { method: 'DELETE' }
  );
}
