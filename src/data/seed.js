// Dữ liệu mẫu cho bản demo. Tên học sinh, giáo viên đều là giả lập.
// Nội dung phiếu học tập do nhóm tự biên soạn theo yêu cầu cần đạt của
// Chương trình GDPT 2018 — KHÔNG sao chép câu chữ, ví dụ, bài tập của SGK.

export const SUBJECTS = [
  { id: 'toan', name: 'Toán' },
  { id: 'van', name: 'Ngữ văn' },
  { id: 'anh', name: 'Tiếng Anh' },
  { id: 'khtn', name: 'KHTN' },
];

export const CLASSES = [
  { id: '6A', grade: 6, teacher: 'Cô Lan' },
  { id: '6B', grade: 6, teacher: 'Thầy Minh' },
  { id: '7A', grade: 7, teacher: 'Cô Hà' },
];

// Mã tra cứu cho phụ huynh: 8 ký tự ngẫu nhiên, bỏ ký tự dễ nhầm (0/O, 1/I/L).
// Tạo bằng crypto trên từng trình duyệt nên không đoán được từ mã nguồn.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function makeAccessCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}
export const formatCode = (c) => `${c.slice(0, 4)}-${c.slice(4)}`;
export const normalizeCode = (s) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');

export const AREAS = ['Khu phố 1', 'Khu phố 2', 'Khu phố 3', 'Ấp Tân Phú'];

// Chỉ đặt LINK tới nền tảng SGK số chính thức của nhà xuất bản.
// Ứng dụng không lưu, không tải về, không phát lại nội dung SGK.
export const DIGITAL_LINKS = [
  { name: 'Hành Trang Số – NXB Giáo dục Việt Nam', url: 'https://hanhtrangso.nxbgd.vn' },
  { name: 'Hoc10 – bộ sách Cánh Diều', url: 'https://hoc10.vn' },
];

const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Võ', 'Đặng', 'Bùi', 'Huỳnh', 'Phan'];
const DEM = ['Văn', 'Thị', 'Minh', 'Gia', 'Ngọc', 'Đức', 'Thanh', 'Bảo', 'Khánh', 'Hoài'];
const TEN = ['An', 'Bình', 'Châu', 'Dũng', 'Giang', 'Hải', 'Khoa', 'Linh', 'My', 'Nam',
  'Oanh', 'Phúc', 'Quân', 'Sơn', 'Trang', 'Vy', 'Yến', 'Tú', 'Hiếu', 'Nhi'];

// RNG có seed để lần nào reset cũng ra cùng một bộ dữ liệu
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeStudents() {
  const rnd = mulberry32(2026);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const students = [];
  for (const c of CLASSES) {
    for (let i = 1; i <= 16; i++) {
      const r = rnd();
      const device = r < 0.32 ? 'none' : r < 0.52 ? 'shared' : 'own';
      const missing = SUBJECTS.filter(() => rnd() < 0.42).map((s) => s.id);
      students.push({
        id: `HS${c.id}${String(i).padStart(2, '0')}`,
        code: makeAccessCode(),
        name: `${pick(HO)} ${pick(DEM)} ${pick(TEN)}`,
        classId: c.id,
        area: pick(AREAS),
        device,
        priority: device === 'none' && rnd() < 0.25,
        missing,
      });
    }
  }
  return students;
}

const SOURCES = ['Thư viện trường', 'Khóa trước để lại', 'Phụ huynh quyên góp'];

function makeBooks() {
  // [môn, khối, số lượng] — cố ý để thiếu ở vài môn cho demo
  const stock = [
    ['toan', 6, 5], ['van', 6, 3], ['anh', 6, 7], ['khtn', 6, 2],
    ['toan', 7, 3], ['van', 7, 2], ['anh', 7, 4], ['khtn', 7, 1],
  ];
  const books = [];
  let n = 0;
  for (const [subjectId, grade, qty] of stock) {
    for (let i = 1; i <= qty; i++) {
      books.push({
        id: `S-${subjectId.toUpperCase()}${grade}-${String(i).padStart(3, '0')}`,
        subjectId,
        grade,
        source: SOURCES[n++ % SOURCES.length],
      });
    }
  }
  return books;
}

export const WORKSHEETS = [
  {
    id: 'P-TOAN6-T1',
    subjectId: 'toan', grade: 6, week: 1,
    title: 'Tập hợp và phần tử của tập hợp',
    author: 'GV. Tổ Toán – THCS Demo',
    license: 'CC BY 4.0',
    yccd: 'Sử dụng được kí hiệu tập hợp, phần tử thuộc / không thuộc tập hợp; biết cách mô tả một tập hợp.',
    objectives: [
      'Hiểu tập hợp là gì, phần tử là gì.',
      'Viết được một tập hợp bằng cách liệt kê phần tử.',
      'Dùng đúng kí hiệu ∈ (thuộc) và ∉ (không thuộc).',
    ],
    summary: [
      'Tập hợp là một nhóm các đối tượng được xác định rõ ràng. Mỗi đối tượng gọi là một phần tử.',
      'Đặt tên tập hợp bằng chữ in hoa: A, B, C… Các phần tử viết trong dấu { }, cách nhau bởi dấu chấm phẩy.',
      'Mỗi phần tử chỉ viết một lần, thứ tự liệt kê không quan trọng.',
      'x ∈ A đọc là "x thuộc A"; y ∉ A đọc là "y không thuộc A".',
    ],
    examples: [
      { q: 'Viết tập hợp M gồm các chữ cái trong từ "SÁCH" (bỏ dấu).', a: 'M = {S; A; C; H}.' },
      { q: 'Cho A = {2; 4; 6}. Số 4 và số 5 có thuộc A không?', a: '4 ∈ A; 5 ∉ A.' },
    ],
    exercises: [
      'Viết tập hợp B gồm các ngày trong tuần có chữ cái đầu là "T" (ví dụ: Thứ Hai…).',
      'Cho C = {bút; thước; tẩy}. Điền ∈ hoặc ∉: bút … C; vở … C; tẩy … C.',
      'Viết tập hợp D các số tự nhiên lớn hơn 3 và nhỏ hơn 9.',
      'Tập hợp các bạn trong tổ em có bao nhiêu phần tử? Hãy liệt kê.',
    ],
  },
  {
    id: 'P-TOAN6-T2',
    subjectId: 'toan', grade: 6, week: 2,
    title: 'Ghi số tự nhiên – giá trị của chữ số theo vị trí',
    author: 'GV. Tổ Toán – THCS Demo',
    license: 'CC BY 4.0',
    yccd: 'Đọc, viết được số tự nhiên; nhận biết giá trị các chữ số theo vị trí trong hệ thập phân; đọc, viết số La Mã không quá 30.',
    objectives: [
      'Hiểu giá trị một chữ số phụ thuộc vào vị trí của nó.',
      'Viết được một số thành tổng theo hàng.',
      'Đọc và viết được số La Mã từ 1 đến 30.',
    ],
    summary: [
      'Hệ thập phân dùng 10 chữ số 0, 1, 2, …, 9. Cứ 10 đơn vị ở một hàng thì bằng 1 đơn vị ở hàng liền trước.',
      'Ví dụ: 3 507 = 3 × 1000 + 5 × 100 + 0 × 10 + 7.',
      'Số La Mã dùng I = 1, V = 5, X = 10. Chữ nhỏ đứng trước chữ lớn thì trừ (IV = 4, IX = 9), đứng sau thì cộng (VI = 6, XI = 11).',
    ],
    examples: [
      { q: 'Trong số 48 260, chữ số 8 có giá trị bao nhiêu?', a: 'Chữ số 8 ở hàng nghìn nên có giá trị 8 000.' },
      { q: 'Viết số 24 bằng số La Mã.', a: '24 = 10 + 10 + 4 → XXIV.' },
    ],
    exercises: [
      'Viết các số sau thành tổng theo hàng: 702; 4 096; 15 300.',
      'Số nhỏ nhất có 4 chữ số khác nhau là số nào?',
      'Đọc các số La Mã: XIV, XIX, XXVI.',
      'Viết bằng số La Mã: 9; 16; 28.',
    ],
  },
  {
    id: 'P-VAN6-T1',
    subjectId: 'van', grade: 6, week: 1,
    title: 'Đọc hiểu truyện: người kể chuyện và nhân vật',
    author: 'GV. Tổ Ngữ văn – THCS Demo',
    license: 'CC BY 4.0',
    yccd: 'Nhận biết được người kể chuyện ngôi thứ nhất, ngôi thứ ba; nhận biết nhân vật qua hành động, lời nói.',
    objectives: [
      'Phân biệt người kể chuyện ngôi thứ nhất và ngôi thứ ba.',
      'Tìm chi tiết thể hiện tính cách nhân vật.',
    ],
    summary: [
      'Ngôi thứ nhất: người kể xưng "tôi", "em", "mình" và thường là một nhân vật trong truyện.',
      'Ngôi thứ ba: người kể đứng ngoài câu chuyện, gọi nhân vật bằng tên hoặc "anh ấy", "cô bé"…',
      'Tính cách nhân vật được thể hiện qua hành động, lời nói, suy nghĩ và cách các nhân vật khác nhìn nhận.',
    ],
    examples: [
      {
        q: 'Đoạn văn (GV tự viết): "Sáng hôm ấy, tôi dậy thật sớm. Chiếc cặp cũ của anh Hai đã được mẹ khâu lại quai. Tôi ôm nó vào lòng, thấy nó thơm mùi nắng." — Người kể ở ngôi thứ mấy?',
        a: 'Ngôi thứ nhất, vì người kể xưng "tôi" và tham gia vào câu chuyện.',
      },
    ],
    exercises: [
      'Viết lại đoạn văn ở ví dụ theo ngôi thứ ba (thay "tôi" bằng một tên nhân vật).',
      'Theo em, chi tiết "ôm chiếc cặp vào lòng" cho thấy nhân vật đang có cảm xúc gì?',
      'Viết 3–5 câu kể về buổi sáng ngày khai giảng của em, dùng ngôi thứ nhất.',
    ],
  },
  {
    id: 'P-ANH6-T1',
    subjectId: 'anh', grade: 6, week: 1,
    title: 'Greetings & School things',
    author: 'GV. Tổ Ngoại ngữ – THCS Demo',
    license: 'CC BY 4.0',
    yccd: 'Chào hỏi, giới thiệu bản thân đơn giản; sử dụng được từ vựng về đồ dùng học tập.',
    objectives: [
      'Chào hỏi và giới thiệu bản thân bằng câu đơn giản.',
      'Gọi tên 10 đồ dùng học tập bằng tiếng Anh.',
    ],
    summary: [
      'Chào hỏi: Hello / Hi. Good morning. How are you? – I\'m fine, thank you.',
      'Giới thiệu: My name is … I\'m … years old. I\'m in class 6A.',
      'Đồ dùng: pen, pencil, ruler, rubber, book, notebook, bag, calculator, compass, pencil case.',
    ],
    examples: [
      { q: 'Hoàn thành: "Hi, my ___ is Nam. I\'m eleven ___ old."', a: 'name; years' },
    ],
    exercises: [
      'Viết 3 câu giới thiệu bản thân bằng tiếng Anh.',
      'Nối từ với nghĩa: ruler – thước kẻ; rubber – ___; calculator – ___; compass – ___.',
      'Nhìn vào cặp sách của em, liệt kê 5 đồ vật bằng tiếng Anh.',
    ],
  },
  {
    id: 'P-KHTN6-T1',
    subjectId: 'khtn', grade: 6, week: 1,
    title: 'Giới thiệu về Khoa học tự nhiên – an toàn khi thực hành',
    author: 'GV. Tổ KHTN – THCS Demo',
    license: 'CC BY 4.0',
    yccd: 'Nêu được khái niệm và vai trò của khoa học tự nhiên; phân biệt các lĩnh vực chính; nêu được quy định an toàn trong phòng thực hành.',
    objectives: [
      'Kể được các lĩnh vực chính của KHTN.',
      'Nêu được ít nhất 4 quy tắc an toàn khi thực hành.',
    ],
    summary: [
      'KHTN nghiên cứu các sự vật, hiện tượng của tự nhiên để hiểu và ứng dụng vào cuộc sống.',
      'Các lĩnh vực chính: Vật lí (năng lượng, chuyển động), Hoá học (chất và sự biến đổi), Sinh học (sinh vật), Khoa học Trái Đất và bầu trời.',
      'An toàn: chỉ làm thí nghiệm khi có giáo viên; không nếm, ngửi trực tiếp hoá chất; buộc tóc gọn; báo ngay khi có sự cố.',
    ],
    examples: [
      { q: 'Hiện tượng "nước đá tan thành nước lỏng" thuộc lĩnh vực nào?', a: 'Vật lí (sự chuyển thể của chất) – cũng liên quan Hoá học khi nói về chất.' },
    ],
    exercises: [
      'Xếp các hiện tượng sau vào đúng lĩnh vực: cây xanh quang hợp; sắt bị gỉ; quả bóng lăn; trăng tròn – khuyết.',
      'Viết 4 quy tắc an toàn em sẽ tuân thủ trong phòng thực hành.',
      'Kể một ứng dụng của KHTN mà em thấy ở nhà.',
    ],
  },
  {
    id: 'P-TOAN7-T1',
    subjectId: 'toan', grade: 7, week: 1,
    title: 'Số hữu tỉ – biểu diễn và so sánh',
    author: 'GV. Tổ Toán – THCS Demo',
    license: 'CC BY 4.0',
    yccd: 'Nhận biết số hữu tỉ; biểu diễn được số hữu tỉ trên trục số; so sánh được hai số hữu tỉ.',
    objectives: [
      'Nhận biết số hữu tỉ và tập hợp ℚ.',
      'Biểu diễn số hữu tỉ trên trục số.',
      'So sánh hai số hữu tỉ.',
    ],
    summary: [
      'Số hữu tỉ là số viết được dưới dạng a/b với a, b là số nguyên, b ≠ 0. Tập hợp số hữu tỉ kí hiệu là ℚ.',
      'Mọi số nguyên, phân số, số thập phân hữu hạn đều là số hữu tỉ. Ví dụ: −3 = −3/1; 0,25 = 1/4.',
      'Để so sánh, đưa hai số về cùng mẫu dương rồi so sánh tử; trên trục số, số bên trái nhỏ hơn số bên phải.',
    ],
    examples: [
      { q: 'So sánh −2/3 và −3/5.', a: '−2/3 = −10/15; −3/5 = −9/15. Vì −10 < −9 nên −2/3 < −3/5.' },
    ],
    exercises: [
      'Viết các số sau dưới dạng a/b: 0,5; −1,2; 4.',
      'Biểu diễn trên trục số: −1/2; 3/4; −5/4.',
      'So sánh: 3/7 và 2/5; −0,6 và −2/3.',
      'Sắp xếp theo thứ tự tăng dần: 1/2; −1/3; 0; −0,5; 2/3.',
    ],
  },
];

function mondayOfThisWeek() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function createSeed() {
  return {
    version: 2,
    phase: 'active', // 'active' | 'closed'
    closedAt: null,
    transitionStart: mondayOfThisWeek(),
    transitionWeeks: 6,
    subjects: SUBJECTS,
    classes: CLASSES,
    students: makeStudents(),
    books: makeBooks(),
    loans: [],
    worksheets: WORKSHEETS,
    digitalLinks: DIGITAL_LINKS,
  };
}
