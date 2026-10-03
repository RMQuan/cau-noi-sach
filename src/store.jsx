import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createSeed, AREAS, makeAccessCode } from './data/seed.js';
import { proposalToLoans } from './logic/allocate.js';

// Store là nơi duy nhất biết dữ liệu được lưu thế nào. Giao diện chỉ đọc
// `state` và gọi `actions`, không tự sửa cấu trúc dữ liệu.

const KEY = 'cau-noi-sach:v1';
const VERSION = 2;
const LOAN_DAYS = 42;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw);
      // Dữ liệu khác phiên bản → nạp lại dữ liệu mẫu thay vì để giao diện lỗi
      if (data?.version === VERSION && Array.isArray(data.students)) return data;
    }
  } catch { /* trình duyệt chặn storage → dùng dữ liệu mẫu */ }
  return createSeed();
}

export function makeLoan(bookId, subjectId, grade, studentIds, now = new Date()) {
  return {
    id: `L-${bookId}-${now.getTime()}`,
    bookId, subjectId, grade, studentIds,
    schedule: {},
    startAt: now.toISOString(),
    dueAt: new Date(now.getTime() + LOAN_DAYS * 864e5).toISOString(),
    returnedAt: null,
  };
}

const StateCtx = createContext(null);
const ActionsCtx = createContext(null);

export function StoreProvider({ children }) {
  const [state, setState] = useState(load);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* bỏ qua */ }
  }, [state]);

  const actions = useMemo(() => {
    const patch = (fn) => setState((s) => ({ ...s, ...fn(s) }));
    const mapStudent = (id, fn) => patch((s) => ({ students: s.students.map((x) => (x.id === id ? { ...x, ...fn(x) } : x)) }));
    const setReturned = (loanId, value) =>
      patch((s) => ({ loans: s.loans.map((l) => (l.id === loanId ? { ...l, returnedAt: value } : l)) }));

    return {
      reset: () => setState(createSeed()),

      updateStudent: (id, fields) => mapStudent(id, () => fields),
      toggleMissing: (id, subjectId) =>
        mapStudent(id, (x) => ({
          missing: x.missing.includes(subjectId) ? x.missing.filter((m) => m !== subjectId) : [...x.missing, subjectId],
        })),
      addStudent: (classId, name) =>
        patch((s) => {
          const nums = s.students.filter((x) => x.classId === classId).map((x) => Number(x.id.slice(-2)) || 0);
          const id = `HS${classId}${String(Math.max(0, ...nums) + 1).padStart(2, '0')}`;
          return { students: [...s.students, { id, code: makeAccessCode(), name, classId, area: AREAS[0], device: 'none', priority: false, missing: [] }] };
        }),

      applyAllocation: (groups) => {
        const loans = proposalToLoans(groups);
        patch((s) => ({ loans: [...s.loans, ...loans] }));
        return loans.length;
      },
      lendBook: (book, studentId) =>
        patch((s) => ({ loans: [...s.loans, makeLoan(book.id, book.subjectId, book.grade, [studentId])] })),
      returnLoan: (loanId) => setReturned(loanId, new Date().toISOString()),
      undoReturn: (loanId) => setReturned(loanId, null),

      addBooks: ({ subjectId, grade, qty, source }) =>
        patch((s) => {
          const prefix = `S-${subjectId.toUpperCase()}${grade}-`;
          const existing = s.books.filter((b) => b.id.startsWith(prefix)).map((b) => Number(b.id.slice(prefix.length)) || 0);
          let n = Math.max(0, ...existing);
          const added = Array.from({ length: qty }, () => ({
            id: `${prefix}${String(++n).padStart(3, '0')}`, subjectId, grade, source,
          }));
          return { books: [...s.books, ...added] };
        }),

      addWorksheet: (ws) => patch((s) => ({ worksheets: [...s.worksheets, ws] })),

      closeTransition: () => patch(() => ({ phase: 'closed', closedAt: new Date().toISOString() })),
      reopenTransition: () => patch(() => ({ phase: 'active', closedAt: null })),
    };
  }, []);

  return (
    <ActionsCtx.Provider value={actions}>
      <StateCtx.Provider value={state}>{children}</StateCtx.Provider>
    </ActionsCtx.Provider>
  );
}

export function useStore() {
  const state = useContext(StateCtx);
  const actions = useContext(ActionsCtx);
  const meta = useMemo(() => {
    const studentById = new Map(state.students.map((s) => [s.id, s]));
    const studentByCode = new Map(state.students.map((s) => [s.code, s]));
    const subjectById = new Map(state.subjects.map((s) => [s.id, s.name]));
    return { studentById, studentByCode, subjectName: (id) => subjectById.get(id) ?? id };
  }, [state.students, state.subjects]);
  return { state, actions, ...meta };
}

const dateFmt = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
const moneyFmt = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
export const fmtDate = (iso) => (iso ? dateFmt.format(new Date(iso)) : '');
export const fmtMoney = (n) => moneyFmt.format(n);

export function downloadCsv(filename, rows) {
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
