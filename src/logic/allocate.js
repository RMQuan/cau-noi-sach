// Thuật toán phân sách giấy tự động.
//
// Nguyên tắc (theo thứ tự):
//  1. Chỉ xét em KHÔNG có thiết bị trước; em có thiết bị dùng SGK số.
//  2. Đủ sách → mỗi em 1 cuốn riêng.
//  3. Thiếu sách → ghép tối đa 2 em / cuốn, ưu tiên cùng lớp + cùng khu ở.
//     Em thuộc diện ưu tiên được giữ sách riêng trước.
//  4. Thiếu quá nhiều (số em > 2 × số sách) → em ưu tiên được nhận trước,
//     em còn lại vào danh sách chờ và học bằng phiếu in.
//  5. Còn dư sách → chia cho em dùng chung thiết bị với người nhà.

import { activeLoans, gradeOf, loanIndex } from './coverage.js';

export const SCHEDULE = [
  'Mang về tối T2, T4, T6 (CN tuần chẵn)',
  'Mang về tối T3, T5, T7 (CN tuần lẻ)',
];

function makePairs(list) {
  const pairs = [];
  let left = [...list];
  const pass = (keyFn, why) => {
    const buckets = new Map();
    for (const s of left) {
      const k = keyFn(s);
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k).push(s);
    }
    const rem = [];
    for (const arr of buckets.values()) {
      for (let i = 0; i + 1 < arr.length; i += 2) pairs.push({ a: arr[i], b: arr[i + 1], why });
      if (arr.length % 2) rem.push(arr[arr.length - 1]);
    }
    left = rem;
  };
  pass((s) => `${s.classId}|${s.area}`, 'Cùng lớp, cùng khu ở');
  pass((s) => s.classId, 'Cùng lớp');
  pass(() => 'all', 'Khác lớp, cùng khối');
  return pairs;
}

// Chia k cuốn cho danh sách em; trả về em giữ riêng, cặp dùng chung, em chờ
export function distribute(students, k) {
  const sorted = [...students].sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0));
  const n = sorted.length;
  if (k >= n) return { singles: sorted, pairs: [], waiting: [] };
  if (k === 0) return { singles: [], pairs: [], waiting: sorted };
  if (n >= 2 * k) {
    const covered = sorted.slice(0, 2 * k);
    return { singles: [], pairs: makePairs(covered), waiting: sorted.slice(2 * k) };
  }
  const s = 2 * k - n; // số cuốn giữ riêng
  const p = n - k; // số cặp
  const singlesPrio = sorted.filter((x) => x.priority).slice(0, s);
  const rest = sorted.filter((x) => !singlesPrio.includes(x));
  const pairs = makePairs(rest).slice(0, p);
  const paired = new Set(pairs.flatMap((x) => [x.a.id, x.b.id]));
  return { singles: [...singlesPrio, ...rest.filter((x) => !paired.has(x.id))], pairs, waiting: [] };
}

export function runAllocation(state) {
  const idx = loanIndex(state);
  const busy = new Set(activeLoans(state).map((l) => l.bookId));
  const grades = [...new Set(state.classes.map((c) => c.grade))].sort((a, b) => a - b);
  const groups = [];

  for (const grade of grades) {
    for (const subj of state.subjects) {
      const free = state.books.filter((b) => b.grade === grade && b.subjectId === subj.id && !busy.has(b.id));
      const need = state.students.filter(
        (s) => gradeOf(state, s.classId) === grade && s.missing.includes(subj.id) && !idx.has(`${s.id}|${subj.id}`),
      );
      if (!need.length) continue;

      const none = need.filter((s) => s.device === 'none');
      const shared = need.filter((s) => s.device === 'shared');
      const r = distribute(none, free.length);
      const items = [];
      let bi = 0;

      for (const s of r.singles) {
        items.push({
          type: 'rieng', bookId: free[bi++].id, studentIds: [s.id],
          note: s.priority && r.pairs.length ? 'Diện ưu tiên – giữ sách riêng' : 'Không có thiết bị',
        });
      }
      for (const pr of r.pairs) {
        items.push({ type: 'cap', bookId: free[bi++].id, studentIds: [pr.a.id, pr.b.id], note: pr.why });
      }
      // Sách còn dư → em dùng chung thiết bị (không ghép cặp vì vẫn có SGK số)
      for (const s of shared) {
        if (bi >= free.length) break;
        items.push({ type: 'rieng', bookId: free[bi++].id, studentIds: [s.id], note: 'Dư sách – em dùng chung thiết bị' });
      }

      groups.push({
        key: `${grade}|${subj.id}`, grade, subjectId: subj.id,
        needNone: none.length, needShared: shared.length,
        free: free.length, used: bi,
        items, waiting: r.waiting.map((s) => s.id),
      });
    }
  }
  return groups;
}

export function proposalToLoans(groups, now = new Date()) {
  const due = new Date(now.getTime() + 42 * 864e5);
  const loans = [];
  for (const g of groups) {
    for (const it of g.items) {
      const schedule = {};
      if (it.type === 'cap') it.studentIds.forEach((sid, i) => (schedule[sid] = SCHEDULE[i]));
      loans.push({
        id: `L-${it.bookId}-${now.getTime()}`,
        bookId: it.bookId,
        subjectId: g.subjectId,
        grade: g.grade,
        studentIds: it.studentIds,
        schedule,
        startAt: now.toISOString(),
        dueAt: due.toISOString(),
        returnedAt: null,
      });
    }
  }
  return loans;
}
