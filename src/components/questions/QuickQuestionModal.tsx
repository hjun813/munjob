import React, { useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/db/database';
import type { Category, Question } from '@/types/interview';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface QuickQuestionModalProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  defaultCategoryId?: string;
  onAdded?: (newQuestionId: string) => void;
}

export function QuickQuestionModal({
  open,
  onClose,
  categories,
  defaultCategoryId,
  onAdded,
}: QuickQuestionModalProps) {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [categoryId, setCategoryId] = useState<string>(
    defaultCategoryId || categories[0]?.id || 'cat-backend'
  );
  const [content, setContent] = useState('');
  const [shortTitle, setShortTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (open) {
      setCategoryId(defaultCategoryId || categories[0]?.id || 'cat-backend');
      setContent('');
      setShortTitle('');
      setMemo('');
      setBulkText('');
      setError('');
    }
  }, [open, defaultCategoryId, categories]);

  const parsedBulkLines = useMemo(() => {
    return bulkText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  }, [bulkText]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'single') {
      const trimmed = content.trim();
      if (!trimmed) {
        setError('질문 내용을 입력해 주세요.');
        return;
      }
      const now = new Date().toISOString();
      const newQ: Question = {
        id: uuidv4(),
        categoryId,
        shortTitle: shortTitle.trim() || undefined,
        content: trimmed,
        memo: memo.trim(),
        createdAt: now,
        updatedAt: now,
      };
      await db.questions.add(newQ);
      onAdded?.(newQ.id);
      onClose();
    } else {
      if (parsedBulkLines.length === 0) {
        setError('한 줄에 하나씩 질문을 입력해 주세요.');
        return;
      }
      const baseTime = Date.now();
      const newItems: Question[] = parsedBulkLines.map((line, idx) => {
        const ts = new Date(baseTime + idx).toISOString();
        return {
          id: uuidv4(),
          categoryId,
          content: line,
          memo: '',
          createdAt: ts,
          updatedAt: ts,
        };
      });
      await db.questions.bulkAdd(newItems);
      if (newItems[0]) {
        onAdded?.(newItems[0].id);
      }
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="면접 질문 추가"
      description="새로운 예상 면접 질문을 하나씩 추가하거나 여러 질문을 한 번에 등록하세요."
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('single');
              setError('');
            }}
            className={`rounded-md py-1.5 text-xs font-semibold transition-all ${
              mode === 'single'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            개별 질문 등록
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('bulk');
              setError('');
            }}
            className={`rounded-md py-1.5 text-xs font-semibold transition-all ${
              mode === 'bulk'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            여러 질문 한 번에 등록
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              면접 카테고리
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {mode === 'single' ? (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  면접 질문 내용 <span className="text-red-500">*</span>
                </label>
                <Textarea
                  rows={2}
                  placeholder="예: 인덱스가 있어도 OFFSET이 느린 이유는 무엇인가요?"
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (error) setError('');
                  }}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  목록용 짧은 제목 (선택)
                </label>
                <Input
                  placeholder="예: OFFSET이 느린 이유는? (비워두면 질문 내용이 그대로 표시됩니다)"
                  value={shortTitle}
                  onChange={(e) => setShortTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  참고 메모 / 핵심 키워드 (선택)
                </label>
                <Input
                  placeholder="예: DB 커넥션 풀, CPU, Offset 페이지네이션"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                />
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  질문 목록 (줄바꿈으로 구분)
                </label>
                <span className="text-xs font-semibold text-blue-600">
                  {parsedBulkLines.length}개 질문
                </span>
              </div>
              <Textarea
                rows={6}
                placeholder={`1분 자기소개를 해주세요.\n지원 동기를 설명해 주세요.\n인덱스가 있어도 OFFSET이 느린 이유는 무엇인가요?\n커서 방식은 어떻게 동작하나요?`}
                value={bulkText}
                onChange={(e) => {
                  setBulkText(e.target.value);
                  if (error) setError('');
                }}
                autoFocus
              />
            </div>
          )}

          {error && <p className="text-xs font-medium text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {mode === 'single'
                ? '질문 추가'
                : `${parsedBulkLines.length}개 질문 등록`}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
