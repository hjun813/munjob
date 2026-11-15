export interface Category {
  id: string;
  name: string;
  color: string;
  isDefault?: boolean;
  createdAt: string;
}

export interface Question {
  id: string;
  categoryId: string;
  shortTitle?: string;
  content: string;
  memo: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionSnapshot {
  id: string;
  categoryId: string;
  categoryName: string;
  shortTitle?: string;
  content: string;
  memo: string;
}

export type QuestionOrderMode = 'sequential' | 'random';

export interface InterviewSettings {
  orderMode: QuestionOrderMode;
  answerLimitSeconds: number; // 0 means unlimited, otherwise 60, 120, 180, 300
  prepTimeSeconds: number; // 0, 10, 30, 60
  videoDeviceId: string;
  audioDeviceId: string;
  mirrorVideo: boolean;
}

export type SessionStatus = 'in_progress' | 'completed' | 'aborted';

export interface InterviewSession {
  id: string;
  title?: string;
  startedAt: string;
  endedAt: string | null;
  questionIds: string[];
  questionSnapshots: Record<string, QuestionSnapshot>;
  settings: InterviewSettings;
  status: SessionStatus;
}

export interface AnswerRecording {
  id: string;
  sessionId: string;
  questionId: string;
  questionSnapshot: QuestionSnapshot;
  videoBlob: Blob | null;
  mimeType: string;
  duration: number; // seconds
  videoSize: number; // bytes
  recordedAt: string;
}

export interface TimestampMemo {
  id: string;
  time: number; // seconds
  text: string;
}

export interface SelfFeedback {
  id: string;
  recordingId: string;
  sessionId: string;
  questionId: string;
  timestampMemos?: TimestampMemo[];
  contentScore: number; // 1 ~ 5
  logicScore: number; // 1 ~ 5
  speakingScore: number; // 1 ~ 5
  eyeContactScore: number; // 1 ~ 5
  confidenceScore: number; // 1 ~ 5
  strengths: string;
  weaknesses: string;
  improvements: string;
  updatedAt: string;
}
