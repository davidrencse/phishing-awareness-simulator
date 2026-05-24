export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type MessageChannel = 'email' | 'sms' | 'collaboration_message';
export type IndicatorSeverity = 'low' | 'medium' | 'high';
export type ResourceCategory = 'reporting' | 'prevention' | 'training' | 'tools' | 'guidelines';
export type ViewName = 'home' | 'scenarios' | 'scenario' | 'dashboard' | 'resources';

export interface Learner {
  id: string;
  displayName?: string;
  createdAt: string;
}

export interface ScenarioSummary {
  id: string;
  title: string;
  summary: string;
  difficulty: Difficulty;
  topics: string[];
  estimatedMinutes: number;
  completed: boolean;
}

export interface SafeDisplayedLink {
  label: string;
  safeDisplayUrl: string;
  isClickable: false;
}

export interface SimulatedAttachment {
  fileName: string;
  description: string;
}

export interface SimulatedMessage {
  channel: MessageChannel;
  fromLabel: string;
  subject: string;
  body: string;
  displayedLinks: SafeDisplayedLink[];
  attachments: SimulatedAttachment[];
}

export interface ScenarioIndicator {
  id: string;
  label: string;
  description: string;
  severity: IndicatorSeverity;
  topic: string;
}

export interface QuizOption {
  id: string;
  label: string;
}

export interface PublicQuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
  topic: string;
}

export interface PublicQuiz {
  scenarioId: string;
  questions: PublicQuizQuestion[];
}

export interface ScenarioDetail {
  id: string;
  title: string;
  summary: string;
  difficulty: Difficulty;
  topics: string[];
  estimatedMinutes: number;
  simulatedMessage: SimulatedMessage;
  indicators: ScenarioIndicator[];
  quiz: PublicQuiz;
}

export interface QuizAnswerInput {
  questionId: string;
  optionId: string;
}

export interface QuizFeedbackItem {
  questionId: string;
  selectedOptionId: string;
  correctOptionId: string;
  isCorrect: boolean;
  explanation: string;
  topic: string;
}

export interface QuizSubmissionResult {
  id: string;
  learnerId: string;
  scenarioId: string;
  scorePercent: number;
  correctCount: number;
  totalQuestions: number;
  submittedAt: string;
  passed: boolean;
}

export interface QuizSubmissionResponse {
  submission: QuizSubmissionResult;
  feedback: QuizFeedbackItem[];
  weakTopics: string[];
  recommendedScenarioIds: string[];
}

export interface TopicPerformance {
  topic: string;
  correctCount: number;
  attemptCount: number;
  scorePercent: number;
}

export interface RecentActivity {
  submissionId: string;
  scenarioId: string;
  scenarioTitle: string;
  scorePercent: number;
  submittedAt: string;
}

export interface ProgressSummary {
  learnerId: string;
  totalScenarios: number;
  completedScenarios: number;
  completionPercent: number;
  averageScorePercent: number;
  topicPerformance: TopicPerformance[];
  recentActivity: RecentActivity[];
  recommendedScenarioIds: string[];
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: ResourceCategory;
  topics: string[];
  url: string;
  sourceName: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: object;
  };
}

export interface ApiErrorShape {
  error?: {
    code: string;
    message: string;
    details?: object;
  };
}
