"""Kiểm thử luồng chính và chụp màn hình mọi trang bằng Playwright.

Chạy (khi dev server đang chạy):
    python3 tests/e2e.py http://localhost:5173 screenshots/sau

Hoặc để skill webapp-testing tự bật server:
    python3 ~/.claude/skills/webapp-testing/scripts/with_server.py --server "npm run dev" --port 5173 -- \
        python3 tests/e2e.py http://localhost:5173 screenshots/sau
"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:5173'
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else 'screenshots/sau')
ONLY_SHOTS = '--chi-chup' in sys.argv  # dùng cho bản cũ: chỉ chụp, không chạy luồng

CONFIGS = [
    ('may-tinh', {'width': 1366, 'height': 900}, 'light'),
    ('may-tinh', {'width': 1366, 'height': 900}, 'dark'),
    ('dien-thoai', {'width': 390, 'height': 844}, 'light'),
    ('dien-thoai', {'width': 390, 'height': 844}, 'dark'),
]

failures = []


def check(cond, msg):
    print(('  ĐẠT  ' if cond else '  LỖI  ') + msg)
    if not cond:
        failures.append(msg)


def run(p, label, viewport, scheme):
    folder = OUT / f'{label}-{"sang" if scheme == "light" else "toi"}'
    folder.mkdir(parents=True, exist_ok=True)
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport=viewport, color_scheme=scheme, is_mobile=label == 'dien-thoai')
    page = ctx.new_page()
    errors = []
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' and 'favicon' not in m.text else None)
    page.on('pageerror', lambda e: errors.append(str(e)))

    def settle(route):
        # Chờ đúng trang mới hiển thị (data-page) và khung "đang tải" biến mất; quan trọng khi chạy trên mạng thật
        name = route.split('/')[0].split('?')[0] or 'gioi-thieu'
        page.wait_for_load_state('networkidle')
        page.wait_for_selector(f'main[data-page="{name}"], main[data-page="404"]', timeout=20000)
        page.wait_for_selector('main h1', timeout=20000)
        page.wait_for_selector('.page-loading', state='detached', timeout=20000)
        page.wait_for_timeout(350)

    def go(route, name):
        page.goto(f'{BASE}/#/{route}')
        settle(route)
        page.screenshot(path=str(folder / f'{name}.png'), full_page=True)

    print(f'\n== {folder.name}')
    page.goto(BASE)
    page.evaluate('localStorage.clear()')

    go('gioi-thieu', '01-gioi-thieu')
    go('tong-quan', '02-tong-quan')

    if ONLY_SHOTS:
        for route, name in [('khao-sat', '04-khao-sat'), ('phan-sach', '03-phan-sach'), ('kho-sach', '05-kho-sach'),
                            ('phieu', '06-phieu'), ('phieu/P-TOAN6-T1', '07-phieu-chi-tiet'),
                            ('phu-huynh/HS6A03', '08-phu-huynh'), ('ket-thuc', '09-ket-thuc')]:
            go(route, name)
        browser.close()
        return

    # Phân sách: chạy, xem đề xuất, áp dụng
    go('phan-sach', '03a-phan-sach-truoc')
    page.get_by_role('button', name='Chạy phân sách').click()
    page.wait_for_timeout(200)
    page.screenshot(path=str(folder / '03b-phan-sach-de-xuat.png'), full_page=True)
    page.get_by_role('button', name='Áp dụng').click()
    expect(page.get_by_role('status').filter(has_text='Đã tạo')).to_be_visible()
    check(True, 'phân sách tạo được lượt mượn và hiện thông báo')
    go('tong-quan', '03c-tong-quan-sau-phan-sach')
    check(page.locator('.pen-circle').count() < 4, 'sau khi phân sách số ô khoanh đỏ giảm')

    # Khảo sát: chọn lớp bằng query, mở QR, đóng bằng Esc
    go('khao-sat?lop=6B', '04-khao-sat')
    check(page.locator('[aria-current="page"]', has_text='Lớp 6B').count() == 1, 'lớp trong URL được chọn đúng')
    page.get_by_role('button', name='Mã QR phụ huynh').first.click()
    dialog = page.locator('dialog[open]')
    expect(dialog).to_be_visible()
    page.screenshot(path=str(folder / '04b-khao-sat-qr.png'))
    page.keyboard.press('Escape')
    expect(dialog).to_have_count(0)
    check(True, 'hộp thoại QR mở được và đóng bằng phím Esc')

    # Ngân hàng sách: nhận lại rồi hoàn tác
    go('kho-sach?loc=dang-muon', '05-kho-sach')
    before = page.get_by_role('button', name='Nhận lại').count()
    page.get_by_role('button', name='Nhận lại').first.click()
    check(page.get_by_role('button', name='Nhận lại').count() == before - 1, 'nhận lại sách làm giảm danh sách đang mượn')
    page.get_by_role('button', name='Hoàn tác').click()
    page.wait_for_timeout(200)
    check(page.get_by_role('button', name='Nhận lại').count() == before, 'hoàn tác khôi phục lượt mượn')

    # Phiếu học tập và phụ huynh
    go('phieu', '06-phieu')
    go('phieu/P-TOAN6-T1', '07-phieu-chi-tiet')
    code = page.evaluate("JSON.parse(localStorage.getItem('cau-noi-sach:v1')).students.find(s => s.id === 'HS6A03').code")
    go(f'phu-huynh/{code}', '08-phu-huynh')
    check(page.get_by_role('heading', level=1).count() == 1, 'trang phụ huynh có đúng một tiêu đề h1')
    go(f'phu-huynh/{code[:4]}-{code[4:].lower()}', '08b-phu-huynh-ma-co-gach')
    check(page.get_by_text('Không tìm thấy mã').count() == 0, 'mã có gạch nối, chữ thường vẫn tra được')
    go('phu-huynh/HS6A03', '08c-phu-huynh-ma-cu')
    check(page.get_by_text('Không tìm thấy mã').count() == 1, 'link theo mã học sinh dễ đoán (HS6A03) không mở được thông tin')

    # Kết thúc chuyển tiếp qua hộp xác nhận
    go('ket-thuc', '09a-ket-thuc')
    page.get_by_role('button', name='Kết thúc chuyển tiếp').click()
    page.locator('dialog[open]').get_by_role('button', name='Kết thúc chuyển tiếp').click()
    expect(page.locator('.banner')).to_be_visible()
    page.screenshot(path=str(folder / '09b-ket-thuc-da-dong.png'), full_page=True)
    check(True, 'kết thúc chuyển tiếp hiện băng thông báo')

    # 404
    go('trang-khong-co', '10-404')
    check(page.get_by_text('Không có trang này').count() == 1, 'đường dẫn sai hiện trang 404')

    # Không cuộn ngang
    for route in ['gioi-thieu', 'tong-quan', 'khao-sat', 'phan-sach', 'kho-sach', 'phieu/P-TOAN6-T1', 'ket-thuc']:
        page.goto(f'{BASE}/#/{route}'); settle(route)
        wide = page.evaluate('document.documentElement.scrollWidth > window.innerWidth + 1')
        check(not wide, f'không cuộn ngang ở {route}')

    check(not errors, 'không có lỗi console' + (f': {errors[:3]}' if errors else ''))
    browser.close()


with sync_playwright() as p:
    for label, vp, scheme in CONFIGS:
        run(p, label, vp, scheme)

print(f'\n{"TẤT CẢ ĐỀU ĐẠT" if not failures else f"{len(failures)} LỖI"}')
sys.exit(1 if failures else 0)
