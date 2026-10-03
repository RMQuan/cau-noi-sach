// Xác định mỗi học sinh đang học môn bị thiếu sách bằng nguồn nào.

export const DEVICE_LABEL = { none: 'Không có', shared: 'Dùng chung', own: 'Có riêng' };

export const STATUS = {
  'sach-rieng': { label: 'Sách riêng', tone: 'good', mark: '✓' },
  'sach-chung': { label: 'Sách dùng chung', tone: 'ok', mark: '◐' },
  so: { label: 'SGK số', tone: 'good', mark: '✓' },
  phieu: { label: 'Chỉ có phiếu', tone: 'bad', mark: '!' },
};

// Giả định ước tính chi phí in phiếu
export const PAGES_PER_SUBJECT_WEEK = 3;
export const PRICE_PER_PAGE = 300; // đồng / trang (in 2 mặt)

export const activeLoans = (state) => state.loans.filter((l) => !l.returnedAt);

export function loanIndex(state) {
  const idx = new Map();
  for (const l of activeLoans(state)) {
    for (const sid of l.studentIds) idx.set(`${sid}|${l.subjectId}`, l);
  }
  return idx;
}

export const gradeOf = (state, classId) => state.classes.find((c) => c.id === classId)?.grade;

export function studentStatus(student, subjectId, idx) {
  const loan = idx.get(`${student.id}|${subjectId}`);
  if (loan) return loan.studentIds.length > 1 ? 'sach-chung' : 'sach-rieng';
  if (student.device !== 'none') return 'so';
  return 'phieu';
}

// Em cần phiếu in khi không giữ sách mỗi tối và không có thiết bị
export const needsPrint = (status) => status === 'sach-chung' || status === 'phieu';

export function currentWeek(state) {
  const start = new Date(state.transitionStart).getTime();
  const w = Math.floor((Date.now() - start) / (7 * 864e5)) + 1;
  return Math.min(Math.max(w, 1), state.transitionWeeks);
}

export function computeCoverage(state) {
  const idx = loanIndex(state);
  const cells = {}; // `${classId}|${subjectId}` -> counts
  let gaps = 0, primary = 0, printSlots = 0;
  const studentsMissing = new Set();
  const studentsOnlyWorksheet = new Set();
  const shortage = {}; // `${grade}|${subjectId}` -> số em chỉ có phiếu

  for (const s of state.students) {
    for (const subj of s.missing) {
      const st = studentStatus(s, subj, idx);
      const key = `${s.classId}|${subj}`;
      const c = (cells[key] ||= { total: 0, 'sach-rieng': 0, 'sach-chung': 0, so: 0, phieu: 0 });
      c.total++;
      c[st]++;
      gaps++;
      studentsMissing.add(s.id);
      if (st !== 'phieu') primary++;
      if (needsPrint(st)) printSlots++;
      if (st === 'phieu') {
        studentsOnlyWorksheet.add(s.id);
        const g = `${gradeOf(state, s.classId)}|${subj}`;
        shortage[g] = (shortage[g] || 0) + 1;
      }
    }
  }

  const onLoan = new Set(activeLoans(state).map((l) => l.bookId));
  const weeksLeft = state.transitionWeeks - currentWeek(state) + 1;
  return {
    cells,
    gaps,
    primary,
    studentsMissing: studentsMissing.size,
    studentsOnlyWorksheet: studentsOnlyWorksheet.size,
    printSlots,
    printCostWeek: printSlots * PAGES_PER_SUBJECT_WEEK * PRICE_PER_PAGE,
    printCostRemaining: printSlots * PAGES_PER_SUBJECT_WEEK * PRICE_PER_PAGE * weeksLeft,
    weeksLeft,
    booksOnLoan: onLoan.size,
    booksFree: state.books.length - onLoan.size,
    shortage,
  };
}

export function cellTone(c) {
  if (!c || c.total === 0) return 'none';
  const ratio = (c.total - c.phieu) / c.total;
  if (ratio >= 1) return 'good';
  if (ratio >= 0.5) return 'ok';
  return 'bad';
}
