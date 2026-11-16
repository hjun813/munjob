import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { db, DEMO_USER } from '@/db/database';
import type { User } from '@/types/interview';

const AUTH_STORAGE_KEY = 'interview_lab_current_user';

export type PublicUser = Omit<User, 'passwordHash'>;

interface AuthState {
  currentUser: PublicUser | null;
  isInitialized: boolean;
  initializeAuth: () => Promise<void>;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<{ ok: boolean; error?: string }>;
  loginAsDemo: () => Promise<void>;
  signup: (params: {
    name: string;
    email: string;
    password: string;
    targetRole: string;
    bio?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: {
    name?: string;
    targetRole?: string;
    bio?: string;
  }) => Promise<void>;
}

function toPublicUser(user: User): PublicUser {
  const { passwordHash: _omitted, ...rest } = user;
  void _omitted;
  return rest;
}

function getStoredUser(): PublicUser | null {
  try {
    const raw =
      localStorage.getItem(AUTH_STORAGE_KEY) ||
      sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PublicUser;
  } catch {
    return null;
  }
}

function persistUser(user: PublicUser | null, remember = true) {
  try {
    if (!user) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }
    const serialized = JSON.stringify(user);
    if (remember) {
      localStorage.setItem(AUTH_STORAGE_KEY, serialized);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } else {
      sessionStorage.setItem(AUTH_STORAGE_KEY, serialized);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: getStoredUser(),
  isInitialized: false,

  initializeAuth: async () => {
    const stored = getStoredUser();
    if (!stored) {
      set({ currentUser: null, isInitialized: true });
      return;
    }

    try {
      const dbUser = await db.users.get(stored.id);
      if (dbUser) {
        const pub = toPublicUser(dbUser);
        set({ currentUser: pub, isInitialized: true });
      } else {
        set({ currentUser: stored, isInitialized: true });
      }
    } catch {
      set({ currentUser: stored, isInitialized: true });
    }
  },

  login: async (email, password, rememberMe = true) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return { ok: false, error: '이메일과 비밀번호를 모두 입력해 주세요.' };
    }

    try {
      const user = await db.users
        .where('email')
        .equalsIgnoreCase(normalizedEmail)
        .first();

      if (!user) {
        return {
          ok: false,
          error: '등록되지 않은 이메일입니다. 이메일을 확인하거나 회원가입을 진행해 주세요.',
        };
      }

      if (user.passwordHash !== password) {
        return {
          ok: false,
          error: '비밀번호가 일치하지 않습니다. 다시 확인해 주세요.',
        };
      }

      const publicUser = toPublicUser(user);
      persistUser(publicUser, rememberMe);
      set({ currentUser: publicUser });
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: '로그인 처리 중 오류가 발생했습니다. 다시 시도해 주세요.',
      };
    }
  },

  loginAsDemo: async () => {
    let demoUser = await db.users.get(DEMO_USER.id);
    if (!demoUser) {
      await db.users.put(DEMO_USER);
      demoUser = DEMO_USER;
    }
    const publicUser = toPublicUser(demoUser);
    persistUser(publicUser, true);
    set({ currentUser: publicUser });
  },

  signup: async ({ name, email, password, targetRole, bio }) => {
    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedRole = targetRole.trim() || '개발자';

    if (!trimmedName) {
      return { ok: false, error: '이름(또는 닉네임)을 입력해 주세요.' };
    }
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { ok: false, error: '유효한 이메일 주소를 입력해 주세요.' };
    }
    if (password.length < 6) {
      return { ok: false, error: '비밀번호는 최소 6자 이상이어야 합니다.' };
    }

    try {
      const existing = await db.users
        .where('email')
        .equalsIgnoreCase(normalizedEmail)
        .first();

      if (existing) {
        return {
          ok: false,
          error: '이미 가입된 이메일 주소입니다. 로그인 페이지에서 로그인해 주세요.',
        };
      }

      const newUser: User = {
        id: `user-${uuidv4()}`,
        email: normalizedEmail,
        passwordHash: password,
        name: trimmedName,
        targetRole: trimmedRole,
        bio: bio?.trim() || '',
        createdAt: new Date().toISOString(),
      };

      await db.users.add(newUser);
      const publicUser = toPublicUser(newUser);
      persistUser(publicUser, true);
      set({ currentUser: publicUser });
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: '회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      };
    }
  },

  logout: () => {
    persistUser(null);
    set({ currentUser: null });
  },

  updateProfile: async (updates) => {
    const current = get().currentUser;
    if (!current) return;

    const updated: PublicUser = {
      ...current,
      name: updates.name?.trim() || current.name,
      targetRole: updates.targetRole?.trim() || current.targetRole,
      bio: updates.bio !== undefined ? updates.bio.trim() : current.bio,
    };

    await db.users.update(current.id, {
      name: updated.name,
      targetRole: updated.targetRole,
      bio: updated.bio,
    });

    persistUser(updated, true);
    set({ currentUser: updated });
  },
}));
