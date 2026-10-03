import { useStore, fmtDate, downloadCsv } from '../store.jsx';
import { activeLoans } from '../logic/coverage.js';
import { EmptyState, PageHeader, Section, useConfirm, useToast } from '../components/ui.jsx';

export default function Finish() {
  const { state, actions, studentById, subjectName } = useStore();
  const confirm = useConfirm();
  const toast = useToast();
  const loans = activeLoans(state);
  const closed = state.phase === 'closed';
  const returned = state.loans.length - loans.length;

  const byClass = {};
  for (const l of loans) {
    const cls = studentById.get(l.studentIds[0])?.classId ?? '?';
    (byClass[cls] ||= []).push(l);
  }
  const holders = (l) => l.studentIds.map((id) => studentById.get(id)?.name).join(' và ');

  const close = async () => {
    const ok = await confirm({
      title: 'Kết thúc giai đoạn chuyển tiếp?',
      body: `Hệ thống sẽ ngừng phân sách mới và lập danh sách thu hồi ${loans.length} cuốn đang cho mượn. Bạn có thể mở lại sau nếu cần.`,
      confirmLabel: 'Kết thúc chuyển tiếp',
      danger: true,
    });
    if (ok) actions.closeTransition();
  };

  const receive = (l) => {
    actions.returnLoan(l.id);
    toast(`Đã thu ${l.bookId}.`, { label: 'Hoàn tác', onClick: () => actions.undoReturn(l.id) });
  };

  const exportList = () =>
    downloadCsv('danh-sach-thu-hoi-sach.csv', [
      ['Lớp', 'Mã sách', 'Môn', 'Học sinh đang giữ', 'Hạn trả'],
      ...Object.entries(byClass).flatMap(([cls, ls]) => ls.map((l) => [cls, l.bookId, `${subjectName(l.subjectId)} ${l.grade}`, holders(l), fmtDate(l.dueAt)])),
    ]);

  return (
    <>
      <PageHeader title="Kết thúc giai đoạn chuyển tiếp">
        Đây là giải pháp tạm thời. Khi sách giáo khoa chính thức đã về đủ, nhà trường ngừng phân sách mới, thu sách luân
        chuyển về thư viện cho năm sau, và giữ kho phiếu làm tài liệu ôn tập.
      </PageHeader>

      <div className={`closure ${closed ? 'is-closed' : ''}`}>
        {closed ? (
          <>
            <h2>Đã kết thúc ngày {fmtDate(state.closedAt)}</h2>
            <p className="muted">Còn {loans.length} cuốn chưa thu hồi, đã thu {returned} cuốn.</p>
            <div className="btn-row"><button className="btn btn-sm" onClick={actions.reopenTransition}>Mở lại giai đoạn chuyển tiếp</button></div>
          </>
        ) : (
          <>
            <h2>Sách chính thức đã về đủ chưa?</h2>
            <p className="muted">Hiện có {loans.length} cuốn đang được học sinh mượn.</p>
            <div className="btn-row"><button className="btn btn-danger" onClick={close}>Kết thúc chuyển tiếp</button></div>
          </>
        )}
      </div>

      <Section
        title="Danh sách thu hồi sách"
        actions={loans.length > 0 && (
          <>
            <button className="btn btn-sm" onClick={exportList}>Tải CSV</button>
            <button className="btn btn-sm" onClick={() => window.print()}>In danh sách</button>
          </>
        )}
      >
        {loans.length === 0 ? (
          <EmptyState title="Không còn cuốn nào ngoài kho">Mọi sách luân chuyển đã về thư viện.</EmptyState>
        ) : (
          Object.entries(byClass).sort().map(([cls, ls]) => (
            <div key={cls} className="recall">
              <h3>Lớp {cls} <span className="muted">({ls.length} cuốn)</span></h3>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr><th scope="col">Mã sách</th><th scope="col">Môn</th><th scope="col">Đang giữ</th><th scope="col">Hạn trả</th><th scope="col" className="no-print"><span className="visually-hidden">Thao tác</span></th></tr>
                  </thead>
                  <tbody>
                    {ls.map((l) => (
                      <tr key={l.id}>
                        <td className="code">{l.bookId}</td>
                        <td>{subjectName(l.subjectId)} {l.grade}</td>
                        <td>{holders(l)}</td>
                        <td className="num">{fmtDate(l.dueAt)}</td>
                        <td className="no-print"><button className="btn btn-sm" onClick={() => receive(l)}>Đã thu</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </Section>
    </>
  );
}
