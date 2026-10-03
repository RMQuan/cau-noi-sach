export default function NotFound() {
  return (
    <div className="not-found">
      <span className="pen-circle" aria-hidden="true">404</span>
      <h1>Không có trang này</h1>
      <p className="muted">Đường dẫn có thể bị gõ sai hoặc trang đã được đổi tên. Chọn một trang trong menu, hoặc quay về trang giới thiệu.</p>
      <div className="btn-row">
        <a className="btn btn-primary" href="#/gioi-thieu">Về trang giới thiệu</a>
        <a className="btn" href="#/tong-quan">Mở tổng quan</a>
      </div>
    </div>
  );
}
