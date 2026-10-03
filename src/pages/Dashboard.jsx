import { useMemo } from 'react';
import { useStore, fmtMoney, downloadCsv } from '../store.jsx';
import { computeCoverage, cellTone, currentWeek } from '../logic/coverage.js';
import { runAllocation } from '../logic/allocate.js';
import { EmptyState, Mark, PageHeader, Section } from '../components/ui.jsx';

const PARTS = [['sach-rieng', 'sách riêng'], ['sach-chung', 'sách chung'], ['so', 'SGK số'], ['phieu', 'chỉ phiếu']];

function HeatCell({ cell }) {
  if (!cell) return <td><span className="heat-none">Không thiếu</span></td>;
  const tone = cellTone(cell);
  const covered = cell.total - cell.phieu;
  const detail = PARTS.filter(([k]) => cell[k] > 0).map(([k, l]) => `${cell[k]} ${l}`).join(', ');
  // Chi tiết chỉ hiện khi rê chuột (title) và cho trình đọc màn hình, để bảng gọn mắt
  return (
    <td title={detail}>
      <span className={`heat-n ${tone === 'bad' ? 'pen-circle' : tone}`}>{covered}/{cell.total}</span>
      <span className="visually-hidden">{tone === 'bad' ? ', cần xử lý' : ''}: {detail}</span>
    </td>
  );
}

export default function Dashboard() {
  const { state, subjectName } = useStore();
  const cov = useMemo(() => computeCoverage(state), [state]);
  const allocatable = useMemo(
    () => (state.phase === 'active' ? runAllocation(state).reduce((n, g) => n + g.items.length, 0) : 0),
    [state],
  );
  const week = currentWeek(state);
  const onlyWorksheet = cov.studentsOnlyWorksheet;

  const shortageRows = Object.entries(cov.shortage)
    .map(([k, n]) => { const [grade, subj] = k.split('|'); return { grade, subj, n }; })
    .sort((a, b) => b.n - a.n);

  const exportShortage = () =>
    downloadCsv('danh-sach-can-bo-sung-sach.csv', [
      ['Khối', 'Môn', 'Số học sinh chưa có sách giấy (không có thiết bị)'],
      ...shortageRows.map((r) => [r.grade, subjectName(r.subj), r.n]),
    ]);

  const todos = [];
  if (allocatable > 0) {
    todos.push({
      text: `Phân ${allocatable} cuốn sách còn trong kho cho học sinh đang thiếu`,
      hint: 'Ưu tiên em không có thiết bị, ghép cặp khi thiếu sách.',
      action: <a className="btn btn-primary btn-sm" href="#/phan-sach">Mở trang phân sách</a>,
    });
  }
  if (cov.printSlots > 0) {
    todos.push({
      text: `In ${cov.printSlots} phiếu học tập tuần ${week}`,
      hint: `Mỗi em không giữ sách riêng nhận một phiếu cho mỗi môn còn thiếu. Ước tính ${fmtMoney(cov.printCostWeek)}.`,
      action: <a href="#/phieu">Mở kho phiếu</a>,
    });
  }
  if (shortageRows.length > 0) {
    const top = shortageRows[0];
    todos.push({
      text: `Kêu gọi thêm sách, nhiều nhất là ${subjectName(top.subj)} ${top.grade} (${top.n} em)`,
      hint: 'Gửi danh sách cho phụ huynh, thư viện trường bạn hoặc kèm hồ sơ xin phép nhà xuất bản.',
      action: <a href="#/tong-quan" onClick={(e) => { e.preventDefault(); exportShortage(); }}>Tải danh sách CSV</a>,
    });
  }

  return (
    <>
      <PageHeader title="Tổng quan toàn trường" />

      <p className={`headline-stat ${onlyWorksheet === 0 ? 'is-good' : ''}`}>
        <strong>{onlyWorksheet}</strong>
        {onlyWorksheet === 0 ? 'em phải học chỉ bằng phiếu. Em nào thiếu sách cũng đã có sách giấy hoặc SGK số.' : 'em chưa có sách hay SGK số, đang học bằng phiếu'}
      </p>
      <p className="headline-sub">
        Tuần {week}/{state.transitionWeeks}. {cov.studentsMissing} em đang thiếu sách, kho còn {cov.booksFree} cuốn. Tính theo
        từng môn: {cov.primary} trên {cov.gaps} trường hợp thiếu sách đã có sách giấy hoặc SGK số.
      </p>

      <div className="split">
        <Section title="Mức độ thiếu sách theo lớp" description="Số em đã có sách hoặc SGK số trên số em thiếu môn đó.">
          <div className="table-wrap">
            <table className="heat">
              <thead>
                <tr><th scope="col">Lớp</th>{state.subjects.map((s) => <th key={s.id} scope="col">{s.name}</th>)}</tr>
              </thead>
              <tbody>
                {state.classes.map((c) => (
                  <tr key={c.id}>
                    <th scope="row"><a href={`#/khao-sat?lop=${c.id}`}>{c.id}</a><small>{c.teacher}</small></th>
                    {state.subjects.map((s) => <HeatCell key={s.id} cell={cov.cells[`${c.id}|${s.id}`]} />)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="legend">
            <Mark tone="good" glyph="✓">Mọi em đã có tài liệu chính</Mark>
            <Mark tone="warn" glyph="◐">Từ một nửa trở lên</Mark>
            <Mark tone="bad" glyph="!">Dưới một nửa, cần xử lý</Mark>
          </div>
        </Section>

        <Section title="Việc cần làm hôm nay">
          {todos.length === 0 ? (
            <EmptyState title="Không còn việc gấp">
              Mọi em thiếu sách đều đã có sách giấy, SGK số hoặc phiếu học tập. Khi sách chính thức về đủ, hãy kết thúc giai
              đoạn chuyển tiếp.
            </EmptyState>
          ) : (
            <ol className="todo">
              {todos.map((t, i) => (
                <li key={i}>
                  <div>
                    <p>{t.text}<span className="muted">{t.hint}</span></p>
                    {t.action}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Section>
      </div>

      {shortageRows.length > 0 && (
        <Section
          title="Cần bổ sung sách giấy"
          description="Số em không có thiết bị và chưa được mượn sách, theo khối và môn."
          actions={<button className="btn btn-sm" onClick={exportShortage}>Tải danh sách CSV</button>}
        >
          <ul className="shortage">
            {shortageRows.map((r) => (
              <li key={`${r.grade}${r.subj}`}>
                <span>{subjectName(r.subj)} {r.grade}</span>
                <strong>{r.n} em</strong>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}
