import { useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useStore, fmtDate } from '../store.jsx';
import { useRoute, buildHref } from '../router.jsx';
import { activeLoans, gradeOf, loanIndex } from '../logic/coverage.js';
import { EmptyState, Field, Mark, PageHeader, useToast } from '../components/ui.jsx';
import QrScanner from '../components/QrScanner.jsx';

const SOURCES = ['Thư viện trường', 'Khóa trước để lại', 'Phụ huynh quyên góp', 'Mượn trường bạn'];
const TABS = [['danh-sach', 'Danh sách'], ['quet', 'Quét mượn và trả'], ['nhap', 'Nhập sách'], ['nhan', 'In nhãn QR']];

function useLoanByBook() {
  const { state } = useStore();
  return useMemo(() => new Map(activeLoans(state).map((l) => [l.bookId, l])), [state]);
}

// Nhận lại sách kèm nút hoàn tác thay cho hộp xác nhận
function useReturnWithUndo() {
  const { actions } = useStore();
  const toast = useToast();
  return (loan) => {
    actions.returnLoan(loan.id);
    toast(`Đã nhận lại ${loan.bookId}.`, { label: 'Hoàn tác', onClick: () => actions.undoReturn(loan.id) });
  };
}

function BookList() {
  const { state, studentById, subjectName } = useStore();
  const { query, setQuery } = useRoute();
  const byBook = useLoanByBook();
  const giveBack = useReturnWithUndo();
  const filter = ['dang-muon', 'trong-kho'].includes(query.loc) ? query.loc : 'tat-ca';
  const books = state.books.filter((b) => (filter === 'tat-ca' ? true : filter === 'dang-muon' ? byBook.has(b.id) : !byBook.has(b.id)));

  return (
    <>
      <div className="toolbar">
        <nav className="tabs" aria-label="Lọc sách">
          {[['tat-ca', 'Tất cả'], ['dang-muon', 'Đang cho mượn'], ['trong-kho', 'Trong kho']].map(([id, l]) => (
            <a key={id} href={buildHref('kho-sach', null, { ...query, loc: id })} aria-current={filter === id ? 'page' : undefined}
              onClick={(e) => { e.preventDefault(); setQuery({ loc: id }); }}>{l}</a>
          ))}
        </nav>
        <span className="muted">{state.books.length} cuốn trong hệ thống, {byBook.size} cuốn đang cho mượn.</span>
      </div>
      {books.length === 0 ? (
        <EmptyState title={filter === 'dang-muon' ? 'Chưa có cuốn nào được cho mượn' : 'Kho đang trống'}
          action={<a className="btn btn-primary" href={filter === 'dang-muon' ? '#/phan-sach' : buildHref('kho-sach', null, { tab: 'nhap' })}>
            {filter === 'dang-muon' ? 'Chạy phân sách' : 'Nhập sách vào kho'}</a>}>
          {filter === 'dang-muon' ? 'Chạy phân sách để cho các em thiếu sách mượn.' : 'Mọi cuốn sách đều đang được học sinh mượn.'}
        </EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th scope="col">Mã sách</th><th scope="col">Sách</th><th scope="col">Nguồn</th><th scope="col">Đang ở</th><th scope="col">Hạn trả</th><th scope="col"><span className="visually-hidden">Thao tác</span></th></tr>
            </thead>
            <tbody>
              {books.map((b) => {
                const l = byBook.get(b.id);
                return (
                  <tr key={b.id}>
                    <td className="code">{b.id}</td>
                    <td>{subjectName(b.subjectId)} {b.grade}</td>
                    <td className="muted">{b.source}</td>
                    <td>
                      {l ? l.studentIds.map((id) => (
                        <div key={id}>{studentById.get(id)?.name} <span className="muted">{studentById.get(id)?.classId}</span></div>
                      )) : <Mark tone="good" glyph="✓">Trong kho</Mark>}
                    </td>
                    <td className="num">{l ? fmtDate(l.dueAt) : ''}</td>
                    <td>{l && <button className="btn btn-sm" onClick={() => giveBack(l)}>Nhận lại</button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function ScanPanel() {
  const { state, actions, studentById, subjectName } = useStore();
  const toast = useToast();
  const byBook = useLoanByBook();
  const giveBack = useReturnWithUndo();
  const [code, setCode] = useState('');
  const [camera, setCamera] = useState(false);
  const [borrower, setBorrower] = useState('');
  const last = useRef('');

  const book = state.books.find((b) => b.id.toLowerCase() === code.trim().toLowerCase());
  const loan = book && byBook.get(book.id);
  const closed = state.phase === 'closed';

  const onScan = (text) => {
    if (text === last.current) return;
    last.current = text;
    setCode(text);
    setCamera(false);
  };

  const idx = loanIndex(state);
  const candidates = book
    ? state.students
      .filter((s) => gradeOf(state, s.classId) === book.grade && s.missing.includes(book.subjectId) && !idx.has(`${s.id}|${book.subjectId}`))
      .sort((a, b) => (a.device === 'none' ? 0 : 1) - (b.device === 'none' ? 0 : 1))
    : [];

  const lend = () => {
    actions.lendBook(book, borrower);
    toast(`Đã cho ${studentById.get(borrower)?.name} mượn ${book.id}.`);
    setBorrower('');
  };

  return (
    <div className="scan-panel">
      <div className="toolbar">
        <Field label="Mã sách" className="grow">
          {(p) => (
            <input {...p} className="input" name="book-code" autoComplete="off" spellCheck={false} placeholder="S-TOAN6-001…"
              value={code} onChange={(e) => { setCode(e.target.value); last.current = ''; }} />
          )}
        </Field>
        <button className="btn" onClick={() => setCamera((c) => !c)}>{camera ? 'Tắt camera' : 'Quét bằng camera'}</button>
      </div>
      {camera && <QrScanner onResult={onScan} />}

      {code && !book && <p className="field-error" role="alert">Không có sách mã "{code}". Kiểm tra lại mã trên nhãn.</p>}
      {book && (
        <div className="sheet book-card">
          <QRCodeSVG value={book.id} size={88} />
          <div>
            <h2>{subjectName(book.subjectId)} {book.grade}</h2>
            <p className="muted"><span className="code">{book.id}</span>, nguồn: {book.source}</p>
            {loan ? (
              <>
                <p>Đang mượn: {loan.studentIds.map((id) => studentById.get(id)?.name).join(' và ')}. Hạn trả {fmtDate(loan.dueAt)}.</p>
                <button className="btn btn-primary" onClick={() => giveBack(loan)}>Ghi nhận trả sách</button>
              </>
            ) : closed ? (
              <p className="muted">Giai đoạn chuyển tiếp đã kết thúc nên không cho mượn mới.</p>
            ) : candidates.length === 0 ? (
              <p className="muted">Không còn em nào thiếu {subjectName(book.subjectId)} {book.grade}. Cuốn này để lại trong kho.</p>
            ) : (
              <div className="toolbar flush">
                <Field label="Cho học sinh mượn" className="grow">
                  {(p) => (
                    <select {...p} className="select" value={borrower} onChange={(e) => setBorrower(e.target.value)}>
                      <option value="">Chọn học sinh…</option>
                      {candidates.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.classId}){s.device === 'none' ? ', không có thiết bị' : ''}</option>
                      ))}
                    </select>
                  )}
                </Field>
                <button className="btn btn-primary" onClick={lend} disabled={!borrower}>Cho mượn</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AddBooks() {
  const { state, actions } = useStore();
  const { setQuery } = useRoute();
  const toast = useToast();
  const grades = [...new Set(state.classes.map((c) => c.grade))];
  const [form, setForm] = useState({ subjectId: state.subjects[0].id, grade: grades[0], qty: '1', source: SOURCES[2] });
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const qty = Number(form.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > 200) {
      setError('Nhập số từ 1 đến 200.');
      e.currentTarget.querySelector('input[name="qty"]')?.focus();
      return;
    }
    actions.addBooks({ subjectId: form.subjectId, grade: Number(form.grade), qty, source: form.source });
    toast(`Đã thêm ${qty} cuốn vào kho. In nhãn QR để dán lên sách.`);
    setQuery({ tab: 'nhan' });
  };

  return (
    <form className="form-grid" onSubmit={submit} noValidate>
      <Field label="Môn">
        {(p) => <select {...p} className="select" value={form.subjectId} onChange={set('subjectId')}>{state.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>}
      </Field>
      <Field label="Khối">
        {(p) => <select {...p} className="select" value={form.grade} onChange={set('grade')}>{grades.map((g) => <option key={g}>{g}</option>)}</select>}
      </Field>
      <Field label="Số lượng" error={error}>
        {(p) => <input {...p} className="input" name="qty" type="number" inputMode="numeric" min="1" max="200" value={form.qty} onChange={(e) => { set('qty')(e); setError(''); }} />}
      </Field>
      <Field label="Nguồn sách">
        {(p) => <select {...p} className="select" value={form.source} onChange={set('source')}>{SOURCES.map((s) => <option key={s}>{s}</option>)}</select>}
      </Field>
      <p className="muted full">
        Chỉ nhập sách giấy đã mua, được tặng hoặc được cho mượn. Cho mượn lại những cuốn này là hợp pháp. Không nhập bản
        photo chưa được nhà xuất bản cấp phép.
      </p>
      <div className="full"><button className="btn btn-primary">Thêm vào kho</button></div>
    </form>
  );
}

function Labels() {
  const { state, subjectName } = useStore();
  return (
    <>
      <div className="toolbar no-print">
        <p className="muted flush">In trang này, cắt theo đường nét đứt và dán nhãn vào bìa sau của sách.</p>
        <button className="btn btn-primary" onClick={() => window.print()}>In nhãn</button>
      </div>
      <div className="labels">
        {state.books.map((b) => (
          <div key={b.id} className="label-card">
            <QRCodeSVG value={b.id} size={68} />
            <div>
              <strong>{subjectName(b.subjectId)} {b.grade}</strong>
              <span className="code">{b.id}</span>
              <small>Sách luân chuyển, xin giữ gìn</small>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function BookBank() {
  const { query, setQuery } = useRoute();
  const tab = TABS.some(([id]) => id === query.tab) ? query.tab : 'danh-sach';
  return (
    <>
      <PageHeader title="Ngân hàng sách luân chuyển">
        Mỗi cuốn sách giấy được dán một mã QR. Khi cho mượn hoặc nhận lại, chỉ cần quét mã là biết ngay sách đang ở tay em nào.
      </PageHeader>
      <nav className="tabs page-tabs no-print" aria-label="Chức năng">
        {TABS.map(([id, l]) => (
          <a key={id} href={buildHref('kho-sach', null, { tab: id })} aria-current={tab === id ? 'page' : undefined}
            onClick={(e) => { e.preventDefault(); setQuery({ tab: id, loc: undefined }); }}>{l}</a>
        ))}
      </nav>
      {tab === 'danh-sach' && <BookList />}
      {tab === 'quet' && <ScanPanel />}
      {tab === 'nhap' && <AddBooks />}
      {tab === 'nhan' && <Labels />}
    </>
  );
}
