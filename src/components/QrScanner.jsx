import { useEffect, useId, useRef, useState } from 'react';

// Quét QR bằng camera (cần HTTPS hoặc localhost). Thư viện chỉ được tải khi mở camera.
export default function QrScanner({ onResult }) {
  const elId = 'qr-' + useId().replace(/:/g, '');
  const cb = useRef(onResult);
  cb.current = onResult;
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [err, setErr] = useState('');

  useEffect(() => {
    let scanner;
    let cancelled = false;
    (async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;
        scanner = new Html5Qrcode(elId);
        await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: 220 }, (text) => cb.current(text), () => {});
        if (cancelled) await scanner.stop();
        else setStatus('ready');
      } catch (e) {
        if (!cancelled) { setStatus('error'); setErr(String(e?.message || e)); }
      }
    })();
    return () => {
      cancelled = true;
      if (scanner?.isScanning) scanner.stop().then(() => scanner.clear()).catch(() => {});
    };
  }, [elId]);

  return (
    <div>
      <div id={elId} className="scanner-view" />
      {status === 'loading' && <p className="muted" role="status">Đang mở camera…</p>}
      {status === 'error' && (
        <p className="field-error" role="alert">
          Không mở được camera ({err}). Hãy cho phép trình duyệt dùng camera, hoặc nhập mã sách bằng tay ở ô phía trên.
        </p>
      )}
    </div>
  );
}
