import { useMemo } from 'react';
import { useStore } from '../store.jsx';
import { computeCoverage } from '../logic/coverage.js';
import { Section } from '../components/ui.jsx';

// Trang giới thiệu: vấn đề, cách hệ thống quyết định cho từng em, căn cứ pháp lý, hướng dẫn demo.

const LAYERS = [
  {
    name: 'Sách giấy luân chuyển',
    what: 'Sách thư viện, sách khóa trước để lại, sách phụ huynh quyên góp. Mỗi cuốn có mã QR để biết đang ở tay em nào.',
    law: 'Cho mượn sách đã mua hoặc được tặng là hợp pháp. Chỉ sao chép hàng loạt mới cần xin phép.',
  },
  {
    name: 'SGK số chính thức',
    what: 'Bản điện tử miễn phí trên nền tảng của nhà xuất bản. Ứng dụng chỉ đặt đường dẫn, không tải về hay đăng lại.',
    law: 'Nội dung do chính chủ sở hữu quyền phát hành.',
  },
  {
    name: 'Phiếu học tập tự soạn',
    what: 'Vài trang tóm tắt kiến thức và bài tập do giáo viên tự viết, bám theo yêu cầu cần đạt của chương trình.',
    law: 'Chương trình GDPT 2018 là văn bản pháp luật, không được bảo hộ quyền tác giả. Phiếu là sản phẩm của giáo viên, chia sẻ theo giấy phép CC BY 4.0.',
  },
];

const ROLES = [
  ['Giáo viên chủ nhiệm', 'Khai báo học sinh thiếu sách, gửi mã QR cho phụ huynh.', [['khao-sat', 'Khảo sát lớp']]],
  ['Thủ thư, ban giám hiệu', 'Xem lớp nào thiếu nhiều, chạy phân sách, cho mượn và nhận lại sách.', [['tong-quan', 'Tổng quan'], ['phan-sach', 'Phân sách'], ['kho-sach', 'Ngân hàng sách']]],
  ['Giáo viên bộ môn', 'Soạn, đăng và in phiếu học tập.', [['phieu', 'Phiếu học tập']]],
  ['Phụ huynh, học sinh', 'Xem sách đang mượn, hạn trả, lịch mang sách về nhà và phiếu của tuần.', [['phu-huynh', 'Tra cứu']]],
];

function Flow() {
  return (
    <div className="flow sheet">
      <div className="flow-start">Em thiếu sách môn Toán</div>
      <div className="flow-q">Em có điện thoại hoặc máy tính để học không?</div>
      <div className="flow-branches">
        <div className="flow-branch">
          <div className="flow-label">Có thiết bị riêng</div>
          <div className="flow-out"><b>Học bằng SGK số</b>Bản điện tử miễn phí của nhà xuất bản. Em xem lúc nào cũng được.</div>
        </div>
        <div className="flow-branch">
          <div className="flow-label">Dùng chung với người nhà</div>
          <div className="flow-out"><b>Học bằng SGK số</b>Nếu kho còn dư sách sau khi chia cho các em không có thiết bị, em được mượn thêm một cuốn.</div>
        </div>
        <div className="flow-branch">
          <div className="flow-label">Không có thiết bị</div>
          <div className="flow-q">Kho còn đủ sách cho mọi em không có thiết bị không?</div>
          <div className="flow-sub">
            <div className="flow-out"><b>Đủ sách</b>Mỗi em mượn một cuốn riêng.</div>
            <div className="flow-out warn"><b>Thiếu một ít</b>Hai em cùng lớp, gần nhà dùng chung một cuốn, mang về nhà theo lịch xen kẽ. Em diện ưu tiên giữ sách riêng trước.</div>
            <div className="flow-out bad"><b>Thiếu nhiều</b>Em vào danh sách chờ và học bằng phiếu in. Nhà trường kêu gọi quyên góp hoặc mượn sách trường bạn.</div>
          </div>
        </div>
      </div>
      <p className="flow-all">
        Ngoài ra, em nào cũng có <strong>phiếu học tập</strong> do giáo viên tự soạn. Em không có thiết bị và không giữ sách
        riêng thì được in phiếu; các em khác nhận file qua Zalo.
      </p>
    </div>
  );
}

export default function Intro() {
  const { state } = useStore();
  const cov = useMemo(() => computeCoverage(state), [state]);

  return (
    <>
      <div className="intro-hero">
        <div>
          <h1>Không em nào phải ngồi không trong những tuần chờ sách</h1>
          <p className="lead">
            Năm học đã bắt đầu nhưng sách giáo khoa chưa về đủ, mà photo sách để dùng tạm thì vi phạm bản quyền. Cầu Nối
            Sách giúp nhà trường xếp mỗi em vào một nguồn học liệu hợp pháp ngay trong tuần đầu, bằng những gì trường đã có.
          </p>
          <div className="btn-row">
            <a className="btn btn-primary" href="#/tong-quan">Xem tổng quan toàn trường</a>
            <a className="btn" href="#/gioi-thieu" onClick={(e) => { e.preventDefault(); document.getElementById('thu-demo')?.scrollIntoView(); }}>
              Thử demo trong 3 phút
            </a>
          </div>
        </div>
        <div className="today" aria-label="Tình hình trường demo hôm nay">
          <div className="today-row"><strong>{cov.studentsMissing}</strong><span>học sinh đang thiếu sách</span></div>
          <div className="today-row"><strong>{cov.studentsOnlyWorksheet}</strong><span>em chưa có sách hay SGK số, đang học bằng phiếu</span></div>
          <div className="today-row"><strong>{state.books.length}</strong><span>cuốn trong ngân hàng sách</span></div>
          <small>Số liệu trực tiếp của trường demo</small>
        </div>
      </div>

      <Section title="Một em thiếu sách sẽ học bằng gì?" description="Giáo viên chủ nhiệm chỉ cần khai báo em thiếu môn nào và em có thiết bị không. Hệ thống quyết định theo sơ đồ này.">
        <Flow />
      </Section>

      <Section title="Ba nguồn học liệu, nguồn nào cũng hợp pháp">
        <dl className="layers">
          {LAYERS.map((l) => (
            <div className="layer" key={l.name}>
              <dt><h3>{l.name}</h3></dt>
              <dd className="flush">
                <p>{l.what}</p>
                <p className="law">{l.law}</p>
              </dd>
            </div>
          ))}
        </dl>
        <p className="note">
          Nếu vẫn cần bản in của sách giáo khoa, nhà trường xin nhà xuất bản cấp phép in riêng các bài của 6 tuần đầu, có
          thời hạn và không bán. Xin phép một phần nhỏ thì dễ được chấp thuận hơn xin cả cuốn.
        </p>
      </Section>

      <Section title="Ai dùng trang nào">
        <div className="table-wrap">
          <table className="table">
            <tbody>
              {ROLES.map(([who, what, links]) => (
                <tr key={who}>
                  <th scope="row">{who}</th>
                  <td>{what}</td>
                  <td>{links.map(([id, label], i) => <span key={id}>{i > 0 && ', '}<a href={`#/${id}`}>{label}</a></span>)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Thử demo trong 3 phút" id="thu-demo">
        <ol className="steps">
          <li><span><a href="#/tong-quan">Mở Tổng quan</a>. Ô khoanh đỏ là lớp có nhiều em chỉ có phiếu, chưa có sách hay SGK số.</span></li>
          <li><span><a href="#/phan-sach">Vào Phân sách</a>, bấm "Chạy phân sách". Xem em nào giữ sách riêng, cặp nào dùng chung và lịch mang sách về nhà, rồi bấm "Áp dụng".</span></li>
          <li><span>Quay lại <a href="#/tong-quan">Tổng quan</a>. Các vòng đỏ biến mất dần.</span></li>
          <li><span><a href="#/khao-sat">Vào Khảo sát lớp</a>, bấm "Mã QR phụ huynh" của một em và mở trang của phụ huynh.</span></li>
          <li><span><a href="#/phieu">Mở một phiếu học tập</a> và bấm "In phiếu hoặc lưu PDF".</span></li>
          <li><span><a href="#/ket-thuc">Vào Kết thúc chuyển tiếp</a>. Khi sách chính thức về đủ, hệ thống ngừng phân sách và lập danh sách thu hồi.</span></li>
        </ol>
        <p className="muted">Dữ liệu là của một trường giả lập. Có thể nạp lại dữ liệu mẫu trong menu để làm lại từ đầu.</p>
      </Section>

      <p className="note note-good">
        <strong>Chỉ là cây cầu tạm.</strong> Hệ thống dùng trong khoảng 6 tuần chờ sách. Khi sách chính thức về đủ, sách
        luân chuyển được thu về thư viện cho năm sau, còn kho phiếu học tập được giữ lại làm tài liệu ôn tập.
      </p>
    </>
  );
}
