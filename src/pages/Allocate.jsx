import { useState } from 'react';
import { useStore } from '../store.jsx';
import { activeLoans } from '../logic/coverage.js';
import { runAllocation, SCHEDULE } from '../logic/allocate.js';
import { EmptyState, Mark, PageHeader, useToast } from '../components/ui.jsx';

function StudentName({ id }) {
  const { studentById } = useStore();
  const s = studentById.get(id);
  if (!s) return id;
  return <span><strong>{s.name}</strong> <span className="muted">{s.classId}{s.priority ? ', diện ưu tiên' : ''}</span></span>;
}

function GroupTable({ group, onRemove }) {
  const { studentById, subjectName } = useStore();
  const short = group.needNone > group.free;
  const tone = !short ? 'good' : group.waiting.length ? 'bad' : 'warn';
  return (
    <section className="alloc-group" aria-label={`${subjectName(group.subjectId)} ${group.grade}`}>
      <div className="alloc-head">
        <h2>{subjectName(group.subjectId)} {group.grade}</h2>
        <Mark tone={tone} glyph={tone === 'good' ? '✓' : tone === 'warn' ? '◐' : '!'}>
          {group.needNone} em không có thiết bị, {group.free} cuốn trong kho
        </Mark>
      </div>

      {group.items.length === 0 && group.waiting.length === 0 && (
        <p className="muted">Các em thiếu môn này đều có thiết bị nên học bằng SGK số.</p>
      )}

      {group.items.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Mã sách</th><th scope="col">Hình thức</th><th scope="col">Học sinh</th>
                <th scope="col">Lý do và lịch mang về</th><th scope="col"><span className="visually-hidden">Thao tác</span></th>
              </tr>
            </thead>
            <tbody>
              {group.items.map((it, i) => (
                <tr key={it.bookId}>
                  <td className="code">{it.bookId}</td>
                  <td>{it.type === 'cap' ? <Mark tone="warn" glyph="◐">Dùng chung</Mark> : <Mark tone="good" glyph="✓">Riêng</Mark>}</td>
                  <td>{it.studentIds.map((id) => <div key={id}><StudentName id={id} /></div>)}</td>
                  <td>
                    <span className="muted">{it.note}</span>
                    {it.type === 'cap' && (
                      <div className="schedule">
                        {it.studentIds.map((id, k) => (
                          <span key={id}>{studentById.get(id)?.name.split(' ').pop()}: {SCHEDULE[k]}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-sm btn-quiet" onClick={() => onRemove(group.key, i)} aria-label={`Bỏ dòng ${it.bookId}`}>Bỏ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {group.waiting.length > 0 && (
        <div className="note waiting">
          <strong>Danh sách chờ, {group.waiting.length} em.</strong> Trong lúc chờ, các em học bằng phiếu in. Cần quyên góp
          thêm sách hoặc mượn sách từ trường khác.
          <div>
            {group.waiting.map((id) => (
              <span key={id} className="tag">{studentById.get(id)?.name} ({studentById.get(id)?.classId})</span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default function Allocate() {
  const { state, actions } = useStore();
  const toast = useToast();
  const [groups, setGroups] = useState(null);
  const closed = state.phase === 'closed';
  const loanCount = activeLoans(state).length;

  const run = () => setGroups(runAllocation(state));

  const removeItem = (gKey, i) =>
    setGroups((gs) => gs.map((g) => {
      if (g.key !== gKey) return g;
      const it = g.items[i];
      return { ...g, items: g.items.filter((_, j) => j !== i), waiting: [...g.waiting, ...it.studentIds] };
    }));

  const apply = () => {
    const n = actions.applyAllocation(groups);
    setGroups(null);
    toast(`Đã tạo ${n} lượt mượn. Xem kết quả ở trang Tổng quan.`);
  };

  const totalItems = groups?.reduce((n, g) => n + g.items.length, 0) ?? 0;

  return (
    <>
      <PageHeader
        title="Phân sách tự động"
        actions={!groups && !closed && <button className="btn btn-primary" onClick={run}>Chạy phân sách</button>}
      >
        Em không có thiết bị được nhận sách trước. Kho đủ thì mỗi em một cuốn; kho thiếu thì hai em cùng lớp, gần nhà
        dùng chung một cuốn và mang về theo lịch xen kẽ. Em diện ưu tiên được giữ sách riêng trước. Bạn xem lại kết quả
        trước khi áp dụng.
      </PageHeader>

      {closed && (
        <EmptyState title="Giai đoạn chuyển tiếp đã kết thúc" action={<a className="btn" href="#/ket-thuc">Xem danh sách thu hồi</a>}>
          Không phân sách mới nữa. Nếu cần phân lại, hãy mở lại giai đoạn chuyển tiếp.
        </EmptyState>
      )}

      {!closed && !groups && (
        <p className="muted">
          Hiện có {loanCount} lượt mượn đang hoạt động. Lần chạy này chỉ xét những em chưa được phân sách cho môn còn thiếu.
        </p>
      )}

      {groups && groups.length === 0 && (
        <EmptyState title="Không còn em nào cần phân sách" action={<a className="btn" href="#/tong-quan">Về tổng quan</a>}>
          Mọi em thiếu sách đã được mượn sách, có SGK số hoặc đang trong danh sách chờ.
        </EmptyState>
      )}

      {groups && groups.length > 0 && (
        <>
          {groups.map((g) => <GroupTable key={g.key} group={g} onRemove={removeItem} />)}
          <div className="apply-bar">
            <span className="muted">Kiểm tra lại các dòng ở trên. Bấm "Bỏ" nếu muốn giữ sách cho em khác.</span>
            <button className="btn" onClick={() => setGroups(null)}>Huỷ</button>
            <button className="btn btn-primary" onClick={apply} disabled={totalItems === 0}>Áp dụng {totalItems} lượt mượn</button>
          </div>
        </>
      )}
    </>
  );
}
