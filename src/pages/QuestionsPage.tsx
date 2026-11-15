import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Plus,
  Search,
  Layers,
  Edit3,
  Trash2,
  FileText,
  Tag,
  Play,
  Check,
  X,
  StickyNote,
  History,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { db, getCategoryColorClasses } from '@/db/database';
import type { Category, Question } from '@/types/interview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { formatDate } from '@/lib/utils';

const COLOR_OPTIONS = [
  { value: 'blue', label: '블루' },
  { value: 'emerald', label: '에메랄드' },
  { value: 'violet', label: '바이올렛' },
  { value: 'amber', label: '앰버' },
  { value: 'rose', label: '로즈' },
  { value: 'cyan', label: '시안' },
  { value: 'slate', label: '슬레이트' },
];

export function QuestionsPage() {
  const navigate = useNavigate();

  const data = useLiveQuery(async () => {
    const [categories, questions, recordings] = await Promise.all([
      db.categories.orderBy('createdAt').toArray(),
      db.questions.orderBy('createdAt').toArray(),
      db.recordings.toArray(),
    ]);

    const practiceCountMap = new Map<string, number>();
    for (const r of recordings) {
      practiceCountMap.set(
        r.questionId,
        (practiceCountMap.get(r.questionId) || 0) + 1
      );
    }

    return { categories, questions, practiceCountMap };
  }, []);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formCategoryId, setFormCategoryId] = useState<string>('cat-backend');
  const [formShortTitle, setFormShortTitle] = useState<string>('');
  const [formContent, setFormContent] = useState<string>('');
  const [formMemo, setFormMemo] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState<string>('cat-backend');
  const [bulkText, setBulkText] = useState<string>('');
  const [bulkError, setBulkError] = useState<string>('');

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('blue');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [editingCatColor, setEditingCatColor] = useState('blue');

  const categories = data?.categories || [];
  const questions = data?.questions || [];
  const practiceCountMap = data?.practiceCountMap || new Map<string, number>();

  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]));
  }, [categories]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesCat =
        selectedCategoryId === 'all' || q.categoryId === selectedCategoryId;
      if (!matchesCat) return false;

      if (!searchQuery.trim()) return true;
      const kw = searchQuery.trim().toLowerCase();
      const catName = categoryMap.get(q.categoryId)?.name.toLowerCase() || '';
      return (
        q.content.toLowerCase().includes(kw) ||
        (q.shortTitle || '').toLowerCase().includes(kw) ||
        q.memo.toLowerCase().includes(kw) ||
        catName.includes(kw)
      );
    });
  }, [questions, selectedCategoryId, searchQuery, categoryMap]);

  const openAddModal = () => {
    setEditingQuestion(null);
    const defaultCat =
      selectedCategoryId !== 'all'
        ? selectedCategoryId
        : categories[0]?.id || 'cat-backend';
    setFormCategoryId(defaultCat);
    setFormShortTitle('');
    setFormContent('');
    setFormMemo('');
    setFormError('');
    setIsQuestionModalOpen(true);
  };

  const openEditModal = (q: Question) => {
    setEditingQuestion(q);
    setFormCategoryId(q.categoryId);
    setFormShortTitle(q.shortTitle || '');
    setFormContent(q.content);
    setFormMemo(q.memo);
    setFormError('');
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedContent = formContent.trim();
    if (!trimmedContent) {
      setFormError('면접 질문 내용을 입력해 주세요.');
      return;
    }

    const now = new Date().toISOString();
    if (editingQuestion) {
      await db.questions.update(editingQuestion.id, {
        categoryId: formCategoryId,
        shortTitle: formShortTitle.trim() || undefined,
        content: trimmedContent,
        memo: formMemo.trim(),
        updatedAt: now,
      });
    } else {
      const newQuestion: Question = {
        id: uuidv4(),
        categoryId: formCategoryId,
        shortTitle: formShortTitle.trim() || undefined,
        content: trimmedContent,
        memo: formMemo.trim(),
        createdAt: now,
        updatedAt: now,
      };
      await db.questions.add(newQuestion);
    }

    setIsQuestionModalOpen(false);
  };

  const handleDeleteQuestion = async (q: Question) => {
    const count = practiceCountMap.get(q.id) || 0;
    const msg =
      count > 0
        ? `이 질문을 삭제하시겠습니까?\n(과거에 녹화한 ${count}개의 답변 영상 및 피드백 기록은 삭제되지 않고 유지됩니다.)`
        : '이 질문을 목록에서 삭제하시겠습니까?';

    if (!window.confirm(msg)) return;
    await db.questions.delete(q.id);
  };

  const openBulkModal = () => {
    const defaultCat =
      selectedCategoryId !== 'all'
        ? selectedCategoryId
        : categories[0]?.id || 'cat-backend';
    setBulkCategoryId(defaultCat);
    setBulkText('');
    setBulkError('');
    setIsBulkModalOpen(true);
  };

  const parsedBulkLines = useMemo(() => {
    return bulkText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }, [bulkText]);

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedBulkLines.length === 0) {
      setBulkError('등록할 질문을 한 줄에 하나씩 입력해 주세요.');
      return;
    }

    const baseTime = Date.now();
    const items: Question[] = parsedBulkLines.map((line, idx) => {
      const ts = new Date(baseTime + idx).toISOString();
      return {
        id: uuidv4(),
        categoryId: bulkCategoryId,
        content: line,
        memo: '',
        createdAt: ts,
        updatedAt: ts,
      };
    });

    await db.questions.bulkAdd(items);
    setIsBulkModalOpen(false);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;

    const newCat: Category = {
      id: `cat-${uuidv4().slice(0, 8)}`,
      name,
      color: newCategoryColor,
      isDefault: false,
      createdAt: new Date().toISOString(),
    };
    await db.categories.add(newCat);
    setNewCategoryName('');
  };

  const startEditCategory = (cat: Category) => {
    setEditingCatId(cat.id);
    setEditingCatName(cat.name);
    setEditingCatColor(cat.color || 'slate');
  };

  const saveEditCategory = async (catId: string) => {
    const trimmed = editingCatName.trim();
    if (!trimmed) return;
    await db.categories.update(catId, {
      name: trimmed,
      color: editingCatColor,
    });
    setEditingCatId(null);
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (categories.length <= 1) {
      alert('최소 1개 이상의 카테고리가 필요합니다.');
      return;
    }
    const assignedQuestions = questions.filter((q) => q.categoryId === cat.id);
    const fallbackCat =
      categories.find((c) => c.id !== cat.id && c.id === 'cat-etc') ||
      categories.find((c) => c.id !== cat.id)!;

    const confirmMsg =
      assignedQuestions.length > 0
        ? `'${cat.name}' 카테고리를 삭제하시겠습니까?\n이 카테고리에 속한 질문 ${assignedQuestions.length}개는 '${fallbackCat.name}' 카테고리로 이동됩니다.`
        : `'${cat.name}' 카테고리를 삭제하시겠습니까?`;

    if (!window.confirm(confirmMsg)) return;

    await db.transaction('rw', db.categories, db.questions, async () => {
      if (assignedQuestions.length > 0) {
        await Promise.all(
          assignedQuestions.map((q) =>
            db.questions.update(q.id, { categoryId: fallbackCat.id })
          )
        );
      }
      await db.categories.delete(cat.id);
    });

    if (selectedCategoryId === cat.id) {
      setSelectedCategoryId('all');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            질문 관리
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            예상 면접 질문을 카테고리별로 등록하고 답변에 참고할 핵심 키워드 메모를 관리하세요.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsCategoryModalOpen(true)}
          >
            <Tag className="h-4 w-4" />
            <span>카테고리 관리</span>
          </Button>
          <Button variant="secondary" onClick={openBulkModal}>
            <Layers className="h-4 w-4" />
            <span>여러 질문 한 번에 등록</span>
          </Button>
          <Button
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>질문 추가</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedCategoryId('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              selectedCategoryId === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            전체 ({questions.length})
          </button>
          {categories.map((cat) => {
            const count = questions.filter((q) => q.categoryId === cat.id).length;
            const active = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-72 shrink-0">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            type="text"
            placeholder="질문 내용 또는 메모 키워드 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {filteredQuestions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-10 w-10 text-slate-400 mb-3" />
            <p className="text-base font-medium text-slate-900">
              등록된 면접 질문이 없습니다
            </p>
            <div className="flex items-center gap-2 mt-4">
              <Button variant="secondary" onClick={openBulkModal}>
                <Layers className="h-4 w-4" />
                <span>여러 질문 한 번에 등록</span>
              </Button>
              <Button
                onClick={openAddModal}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4" />
                <span>새 질문 추가</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredQuestions.map((q) => {
            const cat = categoryMap.get(q.categoryId);
            const practiceCount = practiceCountMap.get(q.id) || 0;

            return (
              <div
                key={q.id}
                className="group rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 shadow-2xs"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${getCategoryColorClasses(
                        cat?.color
                      )}`}
                    >
                      {cat?.name || '기타'}
                    </span>

                    {practiceCount > 0 && (
                      <button
                        type="button"
                        onClick={() => navigate(`/records?questionId=${q.id}`)}
                        className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        <History className="h-3 w-3" />
                        <span>이전 녹화 {practiceCount}개</span>
                      </button>
                    )}

                    <span className="text-xs text-slate-400">
                      등록일: {formatDate(q.createdAt, false)}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {q.content}
                  </h3>

                  {q.memo && (
                    <div className="flex items-start gap-2 rounded-lg bg-slate-50 border border-slate-200/80 px-3 py-2 text-xs text-slate-600">
                      <StickyNote className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-slate-800 font-semibold mr-1.5">
                          참고 메모:
                        </strong>
                        {q.memo}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/?questionId=${q.id}`)}
                  >
                    <Play className="h-3.5 w-3.5 text-blue-600" />
                    <span>연습실에서 녹화</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditModal(q)}
                    title="질문 수정"
                  >
                    <Edit3 className="h-4 w-4 text-slate-500 hover:text-slate-900" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteQuestion(q)}
                    title="질문 삭제"
                  >
                    <Trash2 className="h-4 w-4 text-slate-500 hover:text-red-500" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        title={editingQuestion ? '면접 질문 수정' : '새 면접 질문 추가'}
        description="예상 면접 질문과 답변 시 참고할 핵심 키워드 메모를 입력하세요."
      >
        <form onSubmit={handleSaveQuestion} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              카테고리
            </label>
            <select
              value={formCategoryId}
              onChange={(e) => setFormCategoryId(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              질문 내용 <span className="text-red-500">*</span>
            </label>
            <Textarea
              rows={3}
              placeholder="예: 인덱스가 있어도 OFFSET이 느린 이유는 무엇인가요?"
              value={formContent}
              onChange={(e) => {
                setFormContent(e.target.value);
                if (formError) setFormError('');
              }}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              목록용 짧은 제목 (선택)
            </label>
            <Input
              placeholder="예: OFFSET이 느린 이유는?"
              value={formShortTitle}
              onChange={(e) => setFormShortTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              참고 메모 (선택)
            </label>
            <Textarea
              rows={2}
              placeholder="예: DB 커넥션 풀, CPU, Offset 페이지네이션"
              value={formMemo}
              onChange={(e) => setFormMemo(e.target.value)}
            />
          </div>

          {formError && (
            <p className="text-xs text-red-500 font-medium">{formError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsQuestionModalOpen(false)}
            >
              취소
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {editingQuestion ? '수정 저장' : '질문 등록'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="여러 질문 한 번에 등록하기"
        description="줄바꿈(Enter)으로 구분하여 여러 면접 질문을 한 번에 등록할 수 있습니다."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleBulkSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              등록할 카테고리 선택
            </label>
            <select
              value={bulkCategoryId}
              onChange={(e) => setBulkCategoryId(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                질문 목록 입력 (한 줄에 질문 1개)
              </label>
              <span className="text-xs text-blue-600 font-semibold">
                인식된 질문: {parsedBulkLines.length}개
              </span>
            </div>
            <Textarea
              rows={8}
              placeholder={`1분 자기소개를 해주세요.\n우리 회사에 지원한 이유는 무엇인가요?\n프로젝트에서 가장 어려웠던 문제는 무엇이었나요?\n팀원과 갈등이 있었던 경험이 있나요?`}
              value={bulkText}
              onChange={(e) => {
                setBulkText(e.target.value);
                if (bulkError) setBulkError('');
              }}
              autoFocus
            />
          </div>

          {bulkError && (
            <p className="text-xs text-red-500 font-medium">{bulkError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBulkModalOpen(false)}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={parsedBulkLines.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {parsedBulkLines.length}개 질문 일괄 등록
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCatId(null);
        }}
        title="카테고리 관리"
        description="질문 분류를 위한 카테고리를 직접 추가하거나 이름을 수정할 수 있습니다."
      >
        <div className="space-y-5">
          <form onSubmit={handleAddCategory} className="flex gap-2">
            <Input
              placeholder="새 카테고리 이름 (예: 프론트엔드 면접)"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1"
            />
            <select
              value={newCategoryColor}
              onChange={(e) => setNewCategoryColor(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
            >
              {COLOR_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <Button
              type="submit"
              size="sm"
              className="h-9 px-3 shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4" />
              <span>추가</span>
            </Button>
          </form>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {categories.map((cat) => {
              const isEditing = editingCatId === cat.id;
              const qCount = questions.filter((q) => q.categoryId === cat.id).length;

              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editingCatName}
                        onChange={(e) => setEditingCatName(e.target.value)}
                        className="h-8 text-xs"
                        autoFocus
                      />
                      <select
                        value={editingCatColor}
                        onChange={(e) => setEditingCatColor(e.target.value)}
                        className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs"
                      >
                        {COLOR_OPTIONS.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-emerald-600"
                        onClick={() => saveEditCategory(cat.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-slate-400"
                        onClick={() => setEditingCatId(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${getCategoryColorClasses(
                            cat.color
                          )}`}
                        >
                          {cat.name}
                        </span>
                        <span className="text-xs text-slate-500">
                          질문 {qCount}개
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => startEditCategory(cat)}
                        >
                          <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleDeleteCategory(cat)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-slate-500 hover:text-red-500" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
}
