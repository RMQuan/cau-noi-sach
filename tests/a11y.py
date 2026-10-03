"""Rà chuẩn truy cập (WCAG 2 AA) bằng axe-core trên mọi trang, chế độ sáng và tối.
Chạy: python3 tests/a11y.py http://localhost:5173
"""
import sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:5173'
AXE = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js'
ROUTES = ['gioi-thieu', 'tong-quan', 'khao-sat', 'phan-sach', 'kho-sach', 'kho-sach?tab=nhap', 'phieu',
          'phieu/P-TOAN6-T1', 'phu-huynh', 'phu-huynh/{code}', 'ket-thuc', 'trang-khong-co']
total = 0
with sync_playwright() as p:
    b = p.chromium.launch()
    for scheme in ('light', 'dark'):
        pg = b.new_context(viewport={'width': 1366, 'height': 900}, color_scheme=scheme).new_page()
        pg.goto(BASE); pg.wait_for_load_state('networkidle')
        code = pg.evaluate("JSON.parse(localStorage.getItem('cau-noi-sach:v1')).students.find(s => s.id === 'HS6A03').code")
        for r in [x.format(code=code) for x in ROUTES]:
            pg.goto(f'{BASE}/#/{r}'); pg.wait_for_load_state('networkidle'); n = r.split('/')[0].split('?')[0]; pg.wait_for_selector(f'main[data-page="{n}"], main[data-page="404"]', timeout=20000); pg.wait_for_selector('main h1', timeout=20000); pg.wait_for_selector('.page-loading', state='detached', timeout=20000); pg.wait_for_timeout(400)
            pg.add_script_tag(url=AXE)
            res = pg.evaluate("axe.run(document, {runOnly: ['wcag2a','wcag2aa','best-practice']}).then(r => r.violations.map(v => [v.id, v.impact, v.nodes.length, v.nodes[0].target.join(' ')]))")
            total += len(res)
            print(f"{scheme:5} {r:22} {'ĐẠT' if not res else res}")
    b.close()
print('\nKHÔNG CÓ VI PHẠM' if total == 0 else f'\n{total} NHÓM VI PHẠM')
