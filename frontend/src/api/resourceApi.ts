import { apiRequest } from './client';
import { Resource, ResourceCategory } from '../types';

export function listResources(params: { category?: ResourceCategory; topic?: string }) {
  return apiRequest<{ resources: Resource[] }>('/api/resources', undefined, {
    category: params.category,
    topic: params.topic,
  });
}
