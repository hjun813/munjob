import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatDurationKorean(seconds: number): string {
  const safeSeconds = Math.max(0, Math.round(seconds));
  if (safeSeconds < 60) {
    return `${safeSeconds}초`;
  }
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  if (secs === 0) {
    return `${mins}분`;
  }
  return `${mins}분 ${secs}초`;
}

export function formatDate(isoString: string | null | undefined, includeTime = true): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '-';
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    if (!includeTime) {
      return `${yyyy}.${mm}.${dd}`;
    }
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
  } catch {
    return '-';
  }
}

export function formatMonthDayTime(isoString: string | null | undefined): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '-';
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${month}월 ${day}일 ${hh}:${min}`;
  } catch {
    return '-';
  }
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getSupportedMimeType(): string {
  if (typeof MediaRecorder === 'undefined') {
    return 'video/webm';
  }
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=h264,opus',
    'video/webm',
    'video/mp4',
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
}

export function getFileExtensionForMime(mimeType: string): string {
  if (mimeType.includes('mp4')) return 'mp4';
  return 'webm';
}

export async function getStorageInfo(): Promise<{
  usage: number;
  quota: number;
  percent: number;
} | null> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percent = quota > 0 ? Math.min(100, Math.round((usage / quota) * 1000) / 10) : 0;
      return { usage, quota, percent };
    } catch {
      return null;
    }
  }
  return null;
}

export function calculateAverageScore(feedback?: {
  contentScore: number;
  logicScore: number;
  speakingScore: number;
  eyeContactScore: number;
  confidenceScore: number;
} | null): number | null {
  if (!feedback) return null;
  const sum =
    feedback.contentScore +
    feedback.logicScore +
    feedback.speakingScore +
    feedback.eyeContactScore +
    feedback.confidenceScore;
  return Math.round((sum / 5) * 10) / 10;
}
