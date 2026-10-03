import { useState } from 'react';
import { useStore, fmtDate } from '../store.jsx';
import { useRoute } from '../router.jsx';
import { currentWeek, DEVICE_LABEL, gradeOf, loanIndex, studentStatus } from '../logic/coverage.js';
import { EmptyState, Field, PageHeader, StatusMark } from '../components/ui.jsx';
import { formatCode, normalizeCode } from '../data/seed.js';

function Lookup({ notFoundId }) {
  const { state } = useStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const submit = (e) => {
    e.preventDefault();
    const v = normalizeCode(code);
    if (v.length !== 8) { setError('Mã tra cứu gồm 8 chữ và số, in trên phiếu giáo viên gửi, ví dụ K7QM-2XFD.'); return; }
    window.location.hash = `#/phu-huynh/${v}`;
  };
  return (
    <>
      <PageHeader title="Tra cứu cho phụ huynh và học sinh">
        Quét mã QR giáo viên chủ nhiệm gửi riêng cho gia đình, hoặc nhập mã tra cứu in trên phiếu, để xem con đang mượn
        sách gì, hạn trả và phiếu học tập của tuần.
      </PageHeader>
      <div className="lookup">
        {notFoundId && (
          <p className="note" role="alert">Không tìm thấy mã "{notFoundId}". Kiểm tra lại mã trên phiếu giáo viên gửi, hoặc hỏi giáo viên chủ nhiệm.</p>
        )}
        <form onSubmit={submit} noValidate>
          <Field label="Mã tra cứu" error={error}>
            {(p) => (
              <input {...p} className="input" name="student-code" autoComplete="off" spellCheck={false} placeholder="K7QM-2XFD…"
                value={code} onChange={(e) => { setCode(e.target.value); setError(''); }} />
            )}
          </Field>
          <button className="btn btn-primary">Tra cứu</button>
        </form>
        <p className="muted">
          Bản demo, mã của học sinh giả lập để thử:{' '}
          {state.students.filter((s) => s.missing.length).slice(0, 3).map((s) => (
            <a key={s.id} href={`#/phu-huynh/${s.code}`} className="tag code">{formatCode(s.code)}</a>
          )).reduce((acc, el, i) => (i ? [...acc, ' ', el] : [el]), [])}
        </p>
      </div>
    </>
  );
}

function SubjectBlock({ st, subj, idx, grade, week }) {
  const { state, studentById, subjectName } = useStore();
  const status = studentStatus(st, subj, idx);
  const loan = idx.get(`${st.id}|${subj}`);
  const partner = loan?.studentIds.find((id) => id !== st.id);
  const sheets = state.worksheets.filter((w) => w.subjectId === subj && w.grade === grade);

  return (
    <section className="subject-block" aria-labelledby={`mon-${subj}`}>
      <div>
        <h2 id={`mon-${subj}`}>{subjectName(subj)} {grade}</h2>
        <StatusMark status={status} />
      </div>
      <div>
        {loan && (
          <>
            <p>Sách số <span className="code">{loan.bookId}</span>, trả trước ngày <strong>{fmtDate(loan.dueAt)}</strong>.</p>
            {partner && (
              <p>
                Dùng chung với bạn <strong>{studentById.get(partner)?.name}</strong>. Em mang sách về nhà vào{' '}
                <strong>{loan.schedule[st.id]?.replace('Mang về ', '')}</strong>. Những tối không giữ sách, em học bằng phiếu bên dưới.
              </p>
            )}
          </>
        )}
        {status === 'so' && (
          <>
            <p>Em học bằng SGK số chính thức, xem miễn phí trên điện thoại hoặc máy tính:</p>
            <ul className="plain-list">
              {state.digitalLinks.map((l) => (
                <li key={l.url}><a href={l.url} target="_blank" rel="noreferrer">{l.name}</a></li>
              ))}
            </ul>
          </>
        )}
        {status === 'phieu' && (
          <p className="note">
            Nhà trường đang tìm thêm sách cho em. Trong lúc chờ, em học bằng phiếu in giáo viên phát trên lớp, hoặc chép bài
            từ bảng vào vở.
          </p>
        )}
        <h3>Phiếu học tập</h3>
        {sheets.length === 0 ? (
          <p className="muted">Giáo viên chưa đăng phiếu cho môn này.</p>
        ) : (
          <ul className="plain-list">
            {sheets.map((w) => (
              <li key={w.id}>
                <a href={`#/phieu/${w.id}`}>Tuần {w.week}: {w.title}</a>
                {w.week === week && <strong className="muted"> (tuần này)</strong>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default function Parent() {
  const { state, studentByCode } = useStore();
  const { param } = useRoute();
  const st = param && studentByCode.get(normalizeCode(param));
  if (!st) return <Lookup notFoundId={param} />;

  const idx = loanIndex(state);
  const grade = gradeOf(state, st.classId);
  const week = currentWeek(state);
  const has = state.subjects.filter((s) => !st.missing.includes(s.id));

  return (
    <>
      <PageHeader title={st.name}>
        Lớp {st.classId}, mã {st.id}. Thiết bị học tập: {DEVICE_LABEL[st.device].toLowerCase()}. Đang ở tuần {week} trên{' '}
        {state.transitionWeeks} của giai đoạn chuyển tiếp.
      </PageHeader>

      {st.missing.length === 0 ? (
        <EmptyState title="Em đã có đủ sách giáo khoa">Không cần hỗ trợ thêm. Chúc em học tốt.</EmptyState>
      ) : (
        st.missing.map((subj) => <SubjectBlock key={subj} st={st} subj={subj} idx={idx} grade={grade} week={week} />)
      )}

      {has.length > 0 && st.missing.length > 0 && <p className="muted">Môn đã có sách: {has.map((s) => s.name).join(', ')}.</p>}
      <p><a href="#/phu-huynh">Tra cứu học sinh khác</a></p>
    </>
  );
}
