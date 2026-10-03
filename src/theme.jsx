import { createContext, useContext, useEffect, useState } from 'react';

// Ba lựa chọn: theo hệ thống, sáng (vở ô li), tối (bảng đen).
// index.html có đoạn script nhỏ đặt class trước khi vẽ để không bị nháy màu.

const KEY = 'cau-noi-sach:theme';
const ThemeCtx = createContext(null);

function readPref() {
  try { return localStorage.getItem(KEY) || 'system'; } catch { return 'system'; }
}

function apply(pref) {
  const dark = pref === 'dark' || (pref === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#1d2823' : '#ffffff');
}

export function ThemeProvider({ children }) {
  const [pref, setPref] = useState(readPref);

  useEffect(() => {
    apply(pref);
    try { localStorage.setItem(KEY, pref); } catch { /* bỏ qua */ }
    if (pref !== 'system') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [pref]);

  return <ThemeCtx.Provider value={{ pref, setPref }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
