import Dexie, { type EntityTable } from 'dexie';
import type {
  Category,
  Question,
  InterviewSession,
  AnswerRecording,
  SelfFeedback,
  User,
} from '@/types/interview';

export class InterviewLabDB extends Dexie {
  categories!: EntityTable<Category, 'id'>;
  questions!: EntityTable<Question, 'id'>;
  sessions!: EntityTable<InterviewSession, 'id'>;
  recordings!: EntityTable<AnswerRecording, 'id'>;
  feedbacks!: EntityTable<SelfFeedback, 'id'>;
  users!: EntityTable<User, 'id'>;

  constructor() {
    super('InterviewLabDatabase');
    this.version(1).stores({
      categories: 'id, name, createdAt',
      questions: 'id, categoryId, createdAt, updatedAt',
      sessions: 'id, startedAt, endedAt, status',
      recordings: 'id, sessionId, questionId, recordedAt',
      feedbacks: 'id, recordingId, sessionId, questionId, updatedAt',
    });
    this.version(2).stores({
      categories: 'id, name, createdAt',
      questions: 'id, categoryId, createdAt, updatedAt',
      sessions: 'id, startedAt, endedAt, status',
      recordings: 'id, sessionId, questionId, recordedAt',
      feedbacks: 'id, recordingId, sessionId, questionId, updatedAt',
      users: 'id, &email, name, createdAt',
    });
  }
}

export const db = new InterviewLabDB();

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-backend',
    name: '백엔드 기술 면접',
    color: 'blue',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-self-intro',
    name: '자기소개',
    color: 'emerald',
    isDefault: true,
    createdAt: '2026-01-01T00:00:01.000Z',
  },
  {
    id: 'cat-motivation',
    name: '지원동기',
    color: 'cyan',
    isDefault: true,
    createdAt: '2026-01-01T00:00:02.000Z',
  },
  {
    id: 'cat-project',
    name: '프로젝트 경험',
    color: 'violet',
    isDefault: true,
    createdAt: '2026-01-01T00:00:03.000Z',
  },
  {
    id: 'cat-tech',
    name: '기술 질문',
    color: 'amber',
    isDefault: true,
    createdAt: '2026-01-01T00:00:04.000Z',
  },
  {
    id: 'cat-behavioral',
    name: '인성 질문',
    color: 'rose',
    isDefault: true,
    createdAt: '2026-01-01T00:00:05.000Z',
  },
  {
    id: 'cat-etc',
    name: '기타',
    color: 'slate',
    isDefault: true,
    createdAt: '2026-01-01T00:00:06.000Z',
  },
];

export const INITIAL_SAMPLE_QUESTIONS: Question[] = [
  {
    id: 'q-sample-1',
    categoryId: 'cat-backend',
    shortTitle: '자기소개를 해주세요',
    content: '1분 자기소개를 해주세요.',
    memo: '핵심 백엔드 역량 2가지와 대용량 트래픽/성능 개선 프로젝트 성과를 중심으로 답변하기',
    createdAt: '2026-01-01T00:01:00.000Z',
    updatedAt: '2026-01-01T00:01:00.000Z',
  },
  {
    id: 'q-sample-2',
    categoryId: 'cat-backend',
    shortTitle: '지원 동기를 설명해 주세요',
    content: '우리 회사에 지원한 동기를 설명해 주세요.',
    memo: '회사의 기술적 과제와 내가 해결해 본 도메인 경험을 연결하기',
    createdAt: '2026-01-01T00:02:00.000Z',
    updatedAt: '2026-01-01T00:02:00.000Z',
  },
  {
    id: 'q-sample-3',
    categoryId: 'cat-backend',
    shortTitle: 'OFFSET이 느린 이유는?',
    content: '인덱스가 있어도 OFFSET이 느린 이유는 무엇인가요?',
    memo: '결론부터 말하기 / 인덱스가 읽고 건너뛰는 행을 예로 들기 / No-Offset(커서) 대안 언급',
    createdAt: '2026-01-01T00:03:00.000Z',
    updatedAt: '2026-01-01T00:03:00.000Z',
  },
  {
    id: 'q-sample-4',
    categoryId: 'cat-backend',
    shortTitle: '커서 방식은 어떻게 동작하나요?',
    content: '커서(Cursor) 기반 페이지네이션 방식은 어떻게 동작하나요?',
    memo: '마지막 조회된 ID나 정렬 키를 기준으로 WHERE 조건으로 바로 탐색하여 O(1)에 가깝게 처리',
    createdAt: '2026-01-01T00:04:00.000Z',
    updatedAt: '2026-01-01T00:04:00.000Z',
  },
  {
    id: 'q-sample-5',
    categoryId: 'cat-backend',
    shortTitle: '캐시 정합성은 어떻게 유지했나요?',
    content: 'DB와 Redis 캐시 간의 데이터 정합성은 어떻게 유지했나요?',
    memo: 'Look-aside + Write-through / TTL 설정 및 캐시 무효화(Eviction) 전략',
    createdAt: '2026-01-01T00:05:00.000Z',
    updatedAt: '2026-01-01T00:05:00.000Z',
  },
  {
    id: 'q-sample-6',
    categoryId: 'cat-backend',
    shortTitle: '트랜잭션의 격리 수준은 무엇인가요?',
    content: 'DB 트랜잭션의 격리 수준(Isolation Level)과 각각의 이상 현상을 설명해 주세요.',
    memo: 'Read Uncommitted, Read Committed, Repeatable Read, Serializable / Dirty Read, Phantom Read',
    createdAt: '2026-01-01T00:06:00.000Z',
    updatedAt: '2026-01-01T00:06:00.000Z',
  },
  {
    id: 'q-sample-7',
    categoryId: 'cat-backend',
    shortTitle: 'N+1 문제가 발생하는 이유는?',
    content: 'ORM 사용 시 N+1 문제가 발생하는 이유와 해결 방법은 무엇인가요?',
    memo: '지연 로딩(Lazy Loading)과 연관 엔티티 조회 쿼리 / Fetch Join, EntityGraph, BatchSize 비교',
    createdAt: '2026-01-01T00:07:00.000Z',
    updatedAt: '2026-01-01T00:07:00.000Z',
  },
  {
    id: 'q-sample-8',
    categoryId: 'cat-backend',
    shortTitle: '수평 확장은 어떻게 설계하나요?',
    content: '트래픽 급증에 대비해 서버 수평 확장(Scale-out)과 장애 대응 전략은 어떻게 설계하나요?',
    memo: 'Stateless 아키텍처, 세션 분리, 로드밸런서, 서킷 브레이커 및 메시지 큐 비동기 처리',
    createdAt: '2026-01-01T00:08:00.000Z',
    updatedAt: '2026-01-01T00:08:00.000Z',
  },
];

export const DEMO_USER: User = {
  id: 'user-demo-1',
  email: 'demo@interviewlab.kr',
  passwordHash: 'password123',
  name: '김인터뷰',
  targetRole: '백엔드 개발자',
  bio: '대용량 트래픽 처리와 안정적인 서버 아키텍처를 고민하는 백엔드 개발자 지망생입니다.',
  createdAt: '2026-01-01T00:00:00.000Z',
};

let initPromise: Promise<void> | null = null;

export function ensureDatabaseSeeded(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await db.categories.bulkPut(DEFAULT_CATEGORIES);

      const existingDemo = await db.users.get(DEMO_USER.id);
      if (!existingDemo) {
        await db.users.put(DEMO_USER);
      }

      const seededV2 = localStorage.getItem('interview_lab_seeded_v2');
      if (!seededV2) {
        const recCount = await db.recordings.count();
        if (recCount === 0) {
          await db.questions.clear();
          await db.questions.bulkPut(INITIAL_SAMPLE_QUESTIONS);
        } else {
          const qCount = await db.questions.count();
          if (qCount === 0) {
            await db.questions.bulkPut(INITIAL_SAMPLE_QUESTIONS);
          }
        }
        localStorage.setItem('interview_lab_seeded_v2', 'true');
      }
    } catch (error) {
      console.error('Database seed error:', error);
    }
  })();

  return initPromise;
}

export function getCategoryColorClasses(color?: string): string {
  switch (color) {
    case 'blue':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'emerald':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'violet':
      return 'bg-violet-50 text-violet-700 border-violet-200';
    case 'amber':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'rose':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'cyan':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}
