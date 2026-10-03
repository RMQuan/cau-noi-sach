import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useStore, fmtDate } from './store.jsx';
import { useRoute } from './router.jsx';
import { useTheme } from './theme.jsx';
import { useConfirm } from './components/ui.jsx';

// Mỗi trang tải riêng; Suspense hiển thị trạng thái đang tải
const PAGES = {
  'gioi-thieu': lazy(() => import('./pages/Intro.jsx')),
  'tong-quan': lazy(() => import('./pages/Dashboard.jsx')),
  'khao-sat': lazy(() => import('./pages/Survey.jsx')),
  'phan-sach': lazy(() => import('./pages/Allocate.jsx')),
  'kho-sach': lazy(() => import('./pages/BookBank.jsx')),
  phieu: lazy(() => import('./pages/Worksheets.jsx')),
  'phu-huynh': lazy(() => import('./pages/Parent.jsx')),
  'ket-thuc': lazy(() => import('./pages/Finish.jsx')),
};
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

const NAV_GROUPS = [
  { label: null, items: [['gioi-thieu', 'Giới thiệu']] },
  {
    label: 'Nhà trường',
    items: [['tong-quan', 'Tổng quan'], ['khao-sat', 'Khảo sát lớp'], ['phan-sach', 'Phân sách'], ['kho-sach', 'Ngân hàng sách'], ['phieu', 'Phiếu học tập']],
  },
  { label: 'Gia đình', items: [['phu-huynh', 'Tra cứu cho phụ huynh']] },
  { label: 'Khi sách đã về', items: [['ket-thuc', 'Kết thúc chuyển tiếp']] },
];

function Brand() {
  return (
    <a className="brand" href="#/gioi-thieu">
      <svg className="brand-logo" viewBox="0 0 32 32" aria-hidden="true">
        <path d="M4 7c4-1.6 8-1.6 12 0v19c-4-1.6-8-1.6-12 0z" />
        <path d="M16 7c4-1.6 8-1.6 12 0v19c-4-1.6-8-1.6-12 0z" />
        <path className="brand-bridge" d="M6 21c3.5-4 16.5-4 20 0" />
      </svg>
      <span className="brand-name">Cầu Nối Sách</span>
    </a>
  );
}

function NavList({ current, onNavigate }) {
  return (
    <nav aria-label="Các trang">
      {NAV_GROUPS.map((g, i) => (
        <div className="nav-group" key={i}>
          {g.label && <div className="nav-label">{g.label}</div>}
          <ul>
            {g.items.map(([id, label]) => (
              <li key={id}>
                <a href={`#/${id}`} aria-current={current === id ? 'page' : undefined} onClick={onNavigate}>{label}</a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function RailFooter({ idPrefix }) {
  const { actions } = useStore();
  const { pref, setPref } = useTheme();
  const confirm = useConfirm();
  const resetData = async () => {
    const ok = await confirm({
      title: 'Nạp lại dữ liệu mẫu?',
      body: 'Mọi thay đổi trên trình duyệt này (lượt mượn, học sinh, phiếu mới) sẽ bị xoá.',
      confirmLabel: 'Nạp lại dữ liệu mẫu',
      danger: true,
    });
    if (ok) actions.reset();
  };
  return (
    <div className="rail-footer">
      <label className="field-label" htmlFor={`${idPrefix}-theme`}>Giao diện</label>
      <select id={`${idPrefix}-theme`} className="select" value={pref} onChange={(e) => setPref(e.target.value)}>
        <option value="system">Theo máy</option>
        <option value="light">Vở ô li (sáng)</option>
        <option value="dark">Bảng đen (tối)</option>
      </select>
      <button className="btn btn-sm btn-quiet" onClick={resetData}>Nạp lại dữ liệu mẫu</button>
    </div>
  );
}

function MobileMenu({ current }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (open) ref.current?.showModal();
  }, [open]);
  const close = () => ref.current?.close();
  return (
    <>
      <button className="btn btn-sm" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>Menu</button>
      {open && (
        <dialog
          ref={ref}
          className="drawer"
          aria-label="Menu"
          onClose={() => setOpen(false)}
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <div className="drawer-head">
            <Brand />
            <button className="btn btn-sm" onClick={close}>Đóng</button>
          </div>
          <NavList current={current} onNavigate={close} />
          <RailFooter idPrefix="drawer" />
        </dialog>
      )}
    </>
  );
}

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidUpdate(prev) { if (prev.page !== this.props.page && this.state.error) this.setState({ error: null }); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="empty" role="alert">
        <h2 className="empty-title">Trang này gặp lỗi khi hiển thị</h2>
        <p>Dữ liệu của bạn vẫn còn nguyên. Hãy tải lại trang. Nếu vẫn lỗi, bấm "Nạp lại dữ liệu mẫu" trong menu.</p>
        <div className="btn-row"><button className="btn btn-primary" onClick={() => window.location.reload()}>Tải lại trang</button></div>
      </div>
    );
  }
}

function PageLoading() {
  return (
    <div className="page-loading" aria-busy="true">
      <span className="visually-hidden" role="status">Đang tải trang…</span>
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-line short" />
      <div className="skeleton skeleton-block" />
    </div>
  );
}

export default function App() {
  const { state } = useStore();
  const { page: rawPage } = useRoute();
  const page = rawPage || 'gioi-thieu';
  const Page = PAGES[page] ?? NotFound;

  useEffect(() => {
    const label = NAV_GROUPS.flatMap((g) => g.items).find(([id]) => id === page)?.[1];
    document.title = label ? `${label} – Cầu Nối Sách` : 'Cầu Nối Sách';
  }, [page]);

  return (
    <div className="shell">
      <a
        className="skip-link"
        href="#noi-dung"
        onClick={(e) => { e.preventDefault(); document.getElementById('noi-dung')?.focus(); }}
      >
        Bỏ qua, đến nội dung chính
      </a>

      <aside className="rail">
        <Brand />
        <NavList current={page} />
        <RailFooter idPrefix="rail" />
      </aside>

      <header className="topbar">
        <Brand />
        <MobileMenu current={page} />
      </header>

      <div className="workspace">
        {state.phase === 'closed' && (
          <div className="banner" role="status">
            Giai đoạn chuyển tiếp đã kết thúc ngày {fmtDate(state.closedAt)}. Hệ thống chỉ còn dùng để thu hồi sách.
          </div>
        )}
        <main id="noi-dung" tabIndex={-1} className="main" data-page={PAGES[page] ? page : '404'}>
          <ErrorBoundary page={page}>
            <Suspense fallback={<PageLoading />}>
              <Page />
            </Suspense>
          </ErrorBoundary>
        </main>
        <footer className="footer">
          Bản demo, dữ liệu lưu trên trình duyệt này. Ứng dụng không lưu trữ nội dung sách giáo khoa, chỉ liên kết tới
          nền tảng SGK số chính thức của nhà xuất bản.
        </footer>
      </div>
    </div>
  );
}
