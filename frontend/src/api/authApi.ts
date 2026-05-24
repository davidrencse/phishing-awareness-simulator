import { apiRequest } from './client';
import { Learner } from '../types';

export function createLearner(payload: { displayName?: string }) {
  return apiRequest<{ learner: Learner }>('/api/learners', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
