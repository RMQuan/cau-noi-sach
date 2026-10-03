import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useStore } from '../store.jsx';
import { useRoute, buildHref } from '../router.jsx';
import { DEVICE_LABEL, loanIndex, studentStatus } from '../logic/coverage.js';
import { Dialog, Field, PageHeader, StatusMark } from '../components/ui.jsx';
import { AREAS, formatCode } from '../data/seed.js';

const parentLink = (code) => `${window.location.origin}${window.location.pathname}#/phu-huynh/${code}`;

function StudentRow({ st, idx, onQr }) {
  const { state, actions, subjectName } = useStore();
  return (
    <tr>
      <th scope="row">
        <div className="student-name">{st.name}</div>
        <small className="muted">{st.id}</small>
      </th>
      <td>
        <select className="select" aria-label={`Khu ở của ${st.name}`} value={st.area} onChange={(e) => actions.updateStudent(st.id, { area: e.target.value })}>
          {AREAS.map((a) => <option key={a}>{a}</option>)}
        </select>
      </td>
      <td>
        <select className="select" aria-label={`Thiết bị học tập của ${st.name}`} value={st.device} onChange={(e) => actions.updateStudent(st.id, { device: e.target.value })}>
          {Object.entries(DEVICE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </td>
      <td className="center">
        <label className="check">
          <input type="checkbox" checked={st.priority} onChange={() => actions.updateStudent(st.id, { priority: !st.priority })} />
          <span className="visually-hidden">{st.name} thuộc diện ưu tiên</span>
        </label>
      </td>
      {state.subjects.map((s) => (
        <td key={s.id} className="center">
          <label className="check">
            <input type="checkbox" checked={st.missing.includes(s.id)} onChange={() => actions.toggleMissing(st.id, s.id)} />
            <span className="visually-hidden">{st.name} thiếu sách {s.name}</span>
          </label>
        </td>
      ))}
      <td>
        {st.missing.length === 0 ? (
          <span className="muted">Đủ sách</span>
        ) : (
          <div className="status-list">
            {st.missing.map((m) => (
              <span key={m}><small>{subjectName(m)}</small><StatusMark status={studentStatus(st, m, idx)} /></span>
            ))}
          </div>
        )}
      </td>
      <td><button className="btn btn-sm" onClick={() => onQr(st)}>Mã QR phụ huynh</button></td>
    </tr>
  );
}

export default function Survey() {
  const { state, actions } = useStore();
  const { query, setQuery } = useRoute();
  const classId = state.classes.some((c) => c.id === query.lop) ? query.lop : state.classes[0].id;
  const [qrFor, setQrFor] = useState(null);
  const [newName, setNewName] = useState('');
  const [nameError, setNameError] = useState('');

  const idx = loanIndex(state);
  const list = state.students.filter((s) => s.classId === classId);
  const cls = state.classes.find((c) => c.id === classId);
  const missingCount = list.filter((s) => s.missing.length).length;
  const noDevice = list.filter((s) => s.missing.length && s.device === 'none').length;

  const addStudent = (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (name.split(/\s+/).length < 2) {
      setNameError('Nhập đủ họ và tên, ví dụ Nguyễn Văn An.');
      e.currentTarget.querySelector('input')?.focus();
      return;
    }
    actions.addStudent(classId, name);
    setNewName('');
    setNameError('');
  };

  return (
    <>
      <PageHeader title="Khảo sát thiếu sách theo lớp">
        Giáo viên chủ nhiệm đánh dấu em nào thiếu sách môn nào và em có thiết bị học tập không. Hệ thống dùng thông tin này
        để xếp em vào sách giấy hoặc SGK số.
      </PageHeader>

      <div className="toolbar">
        <nav className="tabs" aria-label="Chọn lớp">
          {state.classes.map((c) => (
            <a
              key={c.id}
              href={buildHref('khao-sat', null, { lop: c.id })}
              aria-current={c.id === classId ? 'page' : undefined}
              onClick={(e) => { e.preventDefault(); setQuery({ lop: c.id }); }}
            >
              Lớp {c.id}
            </a>
          ))}
        </nav>
        <span className="class-summary">
          GVCN {cls.teacher}. {missingCount} em thiếu sách, trong đó {noDevice} em không có thiết bị.
        </span>
      </div>

      <div className="table-wrap">
        <table className="table survey">
          <caption className="visually-hidden">Danh sách học sinh lớp {classId}</caption>
          <thead>
            <tr>
              <th scope="col">Học sinh</th>
              <th scope="col">Khu ở</th>
              <th scope="col">Thiết bị</th>
              <th scope="col" className="center" title="Hoàn cảnh khó khăn, nhà xa, cần hỗ trợ học tập">Ưu tiên</th>
              {state.subjects.map((s) => <th key={s.id} scope="col" className="center">Thiếu {s.name}</th>)}
              <th scope="col">Tình trạng</th>
              <th scope="col"><span className="visually-hidden">Mã QR</span></th>
            </tr>
          </thead>
          <tbody>
            {list.map((st) => <StudentRow key={st.id} st={st} idx={idx} onQr={setQrFor} />)}
          </tbody>
        </table>
      </div>

      <form className="add-row" onSubmit={addStudent} noValidate>
        <Field label="Thêm học sinh vào lớp này" error={nameError}>
          {(p) => (
            <input
              {...p}
              className="input"
              name="student-name"
              autoComplete="off"
              placeholder="Nguyễn Văn An…"
              value={newName}
              onChange={(e) => { setNewName(e.target.value); if (nameError) setNameError(''); }}
            />
          )}
        </Field>
        <button className="btn btn-primary">Thêm học sinh</button>
      </form>

      {qrFor && (
        <Dialog title={`Mã QR cho phụ huynh em ${qrFor.name}`} onClose={() => setQrFor(null)}>
          <div className="qr-box">
            <QRCodeSVG value={parentLink(qrFor.code)} size={192} />
            <p>Mã tra cứu: <strong className="code">{formatCode(qrFor.code)}</strong></p>
            <p className="muted">
              Chỉ gửi riêng cho phụ huynh em này (nhắn riêng hoặc dán vào vở), không đăng vào nhóm chung. Quét mã để xem sách được mượn, hạn trả, lịch mang về nhà và phiếu học
              tập trong tuần.
            </p>
            <a href={`#/phu-huynh/${qrFor.code}`}>Mở trang của phụ huynh</a>
          </div>
        </Dialog>
      )}
    </>
  );
}
