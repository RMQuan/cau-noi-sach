import { useRef, useState } from 'react';
import { useStore } from '../store.jsx';
import { useRoute, buildHref } from '../router.jsx';
import { EmptyState, Field, PageHeader, useToast } from '../components/ui.jsx';
import WorksheetView from '../components/WorksheetView.jsx';

const lines = (t) => t.split('\n').map((x) => x.trim()).filter(Boolean);

function NewWorksheet({ onClose }) {
  const { state, actions } = useStore();
  const toast = useToast();
  const formRef = useRef(null);
  const grades = [...new Set(state.classes.map((c) => c.grade))];
  const [f, setF] = useState({
    subjectId: state.subjects[0].id, grade: String(grades[0]), week: '1', title: '', author: '',
    yccd: '', objectives: '', summary: '', examples: '', exercises: '', original: false,
  });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setF((x) => ({ ...x, [k]: v }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const validate = () => {
    const er = {};
    if (!f.author.trim()) er.author = 'Ghi tên người soạn để người khác biết nguồn.';
    if (!f.title.trim()) er.title = 'Nhập tên bài.';
    if (!f.yccd.trim()) er.yccd = 'Ghi yêu cầu cần đạt mà phiếu bám theo.';
    if (!lines(f.summary).length) er.summary = 'Viết ít nhất một ý ghi nhớ.';
    if (!lines(f.exercises).length) er.exercises = 'Ra ít nhất một bài tập.';
    if (!f.original) er.original = 'Cần cam kết nội dung tự soạn trước khi lưu.';
    return er;
  };

  const submit = (e) => {
    e.preventDefault();
    const er = validate();
    setErrors(er);
    const first = Object.keys(er)[0];
    if (first) {
      formRef.current.querySelector(`[name="${first}"]`)?.focus();
      return;
    }
    const id = `P-${f.subjectId.toUpperCase()}${f.grade}-T${f.week}-${Date.now().toString(36)}`;
    actions.addWorksheet({
      id, subjectId: f.subjectId, grade: Number(f.grade), week: Number(f.week),
      title: f.title.trim(), author: f.author.trim(), license: 'CC BY 4.0', yccd: f.yccd.trim(),
      objectives: lines(f.objectives), summary: lines(f.summary), exercises: lines(f.exercises),
      examples: lines(f.examples).map((l) => { const [q, a = ''] = l.split('||'); return { q: q.trim(), a: a.trim() }; }),
    });
    toast('Đã lưu phiếu vào kho.');
    window.location.hash = `#/phieu/${id}`;
  };

  return (
    <section className="section sheet sheet-pad" aria-labelledby="new-ws">
      <div className="section-head">
        <h2 id="new-ws">Soạn phiếu mới</h2>
        <button className="btn btn-sm" onClick={onClose}>Đóng</button>
      </div>
      <form ref={formRef} className="form-grid" onSubmit={submit} noValidate>
        <Field label="Môn">{(p) => <select {...p} name="subjectId" className="select" value={f.subjectId} onChange={set('subjectId')}>{state.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>}</Field>
        <Field label="Khối">{(p) => <select {...p} name="grade" className="select" value={f.grade} onChange={set('grade')}>{grades.map((g) => <option key={g}>{g}</option>)}</select>}</Field>
        <Field label="Tuần">{(p) => <input {...p} name="week" className="input" type="number" inputMode="numeric" min="1" max={state.transitionWeeks} value={f.week} onChange={set('week')} />}</Field>
        <Field label="Người soạn" error={errors.author}>{(p) => <input {...p} name="author" className="input" autoComplete="name" placeholder="GV. Nguyễn Văn An, THCS…" value={f.author} onChange={set('author')} />}</Field>
        <Field label="Tên bài" error={errors.title} className="full">{(p) => <input {...p} name="title" className="input" autoComplete="off" value={f.title} onChange={set('title')} />}</Field>
        <Field label="Yêu cầu cần đạt theo Chương trình GDPT 2018" error={errors.yccd} className="full">{(p) => <input {...p} name="yccd" className="input" autoComplete="off" value={f.yccd} onChange={set('yccd')} />}</Field>
        <Field label="Mục tiêu" hint="Mỗi dòng một ý." className="full">{(p) => <textarea {...p} name="objectives" className="textarea" rows="3" value={f.objectives} onChange={set('objectives')} />}</Field>
        <Field label="Ghi nhớ" hint="Kiến thức cốt lõi, tự diễn đạt, mỗi dòng một ý." error={errors.summary} className="full">{(p) => <textarea {...p} name="summary" className="textarea" rows="4" value={f.summary} onChange={set('summary')} />}</Field>
        <Field label="Ví dụ" hint="Mỗi dòng: câu hỏi || lời giải." className="full">{(p) => <textarea {...p} name="examples" className="textarea" rows="3" value={f.examples} onChange={set('examples')} />}</Field>
        <Field label="Bài tập" hint="Tự ra đề, mỗi dòng một bài." error={errors.exercises} className="full">{(p) => <textarea {...p} name="exercises" className="textarea" rows="4" value={f.exercises} onChange={set('exercises')} />}</Field>
        <div className="full">
          <label className="check">
            <input type="checkbox" name="original" checked={f.original} onChange={set('original')} aria-invalid={errors.original ? true : undefined} aria-describedby={errors.original ? 'original-error' : undefined} />
            <span>
              Tôi cam kết nội dung phiếu do tôi tự biên soạn, không sao chép câu chữ, ví dụ, bài tập hay hình ảnh từ sách
              giáo khoa, và đồng ý chia sẻ phiếu theo giấy phép CC BY 4.0.
            </span>
          </label>
          {errors.original && <span className="field-error" id="original-error">{errors.original}</span>}
        </div>
        <div className="full btn-row">
          <button className="btn btn-primary">Lưu phiếu</button>
          <button type="button" className="btn" onClick={onClose}>Huỷ</button>
        </div>
      </form>
    </section>
  );
}

export default function Worksheets() {
  const { state, subjectName } = useStore();
  const { param: openId, query, setQuery } = useRoute();
  const [creating, setCreating] = useState(false);

  if (openId) {
    const open = state.worksheets.find((w) => w.id === openId);
    if (!open) {
      return (
        <EmptyState title="Không tìm thấy phiếu này" action={<a className="btn btn-primary" href="#/phieu">Về kho phiếu</a>}>
          Phiếu có thể đã bị xoá khi nạp lại dữ liệu mẫu.
        </EmptyState>
      );
    }
    return (
      <>
        <div className="btn-row no-print page-tabs">
          <a className="btn" href="#/phieu">Quay lại kho phiếu</a>
          <button className="btn btn-primary" onClick={() => window.print()}>In phiếu hoặc lưu PDF</button>
        </div>
        <WorksheetView ws={open} />
      </>
    );
  }

  const grades = [...new Set(state.classes.map((c) => c.grade))];
  const subj = query.mon ?? '';
  const grade = query.khoi ?? '';
  const list = state.worksheets
    .filter((w) => (!subj || w.subjectId === subj) && (!grade || w.grade === Number(grade)))
    .sort((a, b) => a.grade - b.grade || a.subjectId.localeCompare(b.subjectId) || a.week - b.week);

  return (
    <>
      <PageHeader
        title="Kho phiếu học tập mở"
        actions={!creating && <button className="btn btn-primary" onClick={() => setCreating(true)}>Soạn phiếu mới</button>}
      >
        Phiếu do giáo viên tự soạn theo yêu cầu cần đạt của Chương trình GDPT 2018, không chép câu chữ, ví dụ hay bài tập
        của sách giáo khoa. Mọi phiếu dùng giấy phép CC BY 4.0: trường nào cũng được in và dùng lại, chỉ cần ghi tên người soạn.
      </PageHeader>

      {creating && <NewWorksheet onClose={() => setCreating(false)} />}

      <div className="toolbar">
        <Field label="Môn">
          {(p) => (
            <select {...p} className="select" value={subj} onChange={(e) => setQuery({ mon: e.target.value })}>
              <option value="">Tất cả các môn</option>
              {state.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
        </Field>
        <Field label="Khối">
          {(p) => (
            <select {...p} className="select" value={grade} onChange={(e) => setQuery({ khoi: e.target.value })}>
              <option value="">Tất cả các khối</option>
              {grades.map((g) => <option key={g} value={g}>Khối {g}</option>)}
            </select>
          )}
        </Field>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="Chưa có phiếu cho môn và khối này"
          action={<>
            <button className="btn btn-primary" onClick={() => setCreating(true)}>Soạn phiếu mới</button>
            <a className="btn" href={buildHref('phieu')}>Xem tất cả phiếu</a>
          </>}
        >
          Mỗi giáo viên soạn vài bài là cả khối có đủ phiếu cho 6 tuần đầu.
        </EmptyState>
      ) : (
        <ul className="ws-list">
          {list.map((w) => (
            <li key={w.id}>
              <a className="ws-card" href={`#/phieu/${w.id}`}>
                <span className="ws-card-meta">{subjectName(w.subjectId)} {w.grade}, tuần {w.week}</span>
                <h2>{w.title}</h2>
                <p>{w.yccd}</p>
                <span className="ws-card-foot">{w.author}, giấy phép {w.license}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
