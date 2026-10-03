import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';

// Router theo hash: #/trang/tham-so?khoa=gia-tri
// Trạng thái như lớp đang chọn, tab, bộ lọc nằm trong query để tải lại trang
// hoặc gửi link vẫn giữ nguyên chỗ đang xem.

function parse(hash) {
  const [path, qs = ''] = hash.replace(/^#\/?/, '').split('?');
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  return { page: parts[0] ?? '', param: parts[1], query: Object.fromEntries(new URLSearchParams(qs)) };
}

export function buildHref(page, param, query) {
  const qs = query ? new URLSearchParams(Object.entries(query).filter(([, v]) => v != null && v !== '')).toString() : '';
  return `#/${page}${param ? `/${encodeURIComponent(param)}` : ''}${qs ? `?${qs}` : ''}`;
}

const RouteCtx = createContext(null);

export function RouterProvider({ children }) {
  const [hash, setHash] = useState(() => window.location.hash);

  useEffect(() => {
    const onChange = () => {
      const next = window.location.hash;
      const samePage = parse(next).page === parse(hash).page;
      const apply = () => flushSync(() => setHash(next));
      // Chỉ chuyển cảnh khi đổi trang; đổi query (tab, bộ lọc) thì cập nhật ngay
      if (!samePage && document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const t = document.startViewTransition(apply);
        // Chuyển trang liên tiếp sẽ bỏ qua hiệu ứng cũ; đó không phải lỗi
        t.ready.catch(() => {});
        t.finished.catch(() => {});
        t.updateCallbackDone.catch(() => {});
      } else {
        apply();
      }
      if (!samePage) window.scrollTo({ top: 0, behavior: 'instant' });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, [hash]);

  const value = useMemo(() => {
    const route = parse(hash);
    const setQuery = (patch) => {
      const next = buildHref(route.page, route.param, { ...route.query, ...patch });
      window.history.replaceState(null, '', next);
      setHash(next);
    };
    return { ...route, setQuery };
  }, [hash]);

  return <RouteCtx.Provider value={value}>{children}</RouteCtx.Provider>;
}

export const useRoute = () => useContext(RouteCtx);
