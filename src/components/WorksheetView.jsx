import { useStore } from '../store.jsx';

export default function WorksheetView({ ws }) {
  const { subjectName } = useStore();
  const hasExamples = ws.examples?.length > 0;
  return (
    <article className="worksheet">
      <header className="ws-head">
        <div className="ws-kicker">Phiếu học tập {subjectName(ws.subjectId)} {ws.grade}, tuần {ws.week}</div>
        <h1>{ws.title}</h1>
        <div className="ws-meta">Họ tên: ……………………………………………… Lớp: …………</div>
      </header>

      {ws.objectives?.length > 0 && (
        <section>
          <h2>Mục tiêu</h2>
          <ul>{ws.objectives.map((o, i) => <li key={i}>{o}</li>)}</ul>
        </section>
      )}

      <section>
        <h2>1. Ghi nhớ</h2>
        <ul>{ws.summary.map((o, i) => <li key={i}>{o}</li>)}</ul>
      </section>

      {hasExamples && (
        <section>
          <h2>2. Ví dụ</h2>
          {ws.examples.map((e, i) => (
            <div key={i} className="ws-example">
              <p><strong>Ví dụ {i + 1}.</strong> {e.q}</p>
              {e.a && <p><em>Lời giải:</em> {e.a}</p>}
            </div>
          ))}
        </section>
      )}

      <section>
        <h2>{hasExamples ? '3' : '2'}. Bài tập</h2>
        <ol>
          {ws.exercises.map((x, i) => (
            <li key={i}>
              {x}
              <div className="ws-lines" aria-hidden="true" />
            </li>
          ))}
        </ol>
      </section>

      <p className="ws-self">☐ Em đã hiểu bài &nbsp;&nbsp; ☐ Em cần thầy cô giảng thêm</p>

      <footer className="ws-foot">
        <p>Bám theo yêu cầu cần đạt (Chương trình GDPT 2018): {ws.yccd}</p>
        <p>
          Người soạn: {ws.author}. Giấy phép {ws.license}: được tự do in, sao chép, chỉnh sửa, chỉ cần ghi tên người soạn.
          Nội dung tự biên soạn, không sao chép từ sách giáo khoa.
        </p>
      </footer>
    </article>
  );
}
