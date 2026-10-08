# 🌊 Apps Script Web App — An Toàn Dưới Nước

Backend Google Sheet cho game `game_01_Bat_dau.html`. Giúp giáo viên:

- ✅ Lưu **câu hỏi, học sinh, điểm, cài đặt** lên Google Sheet (chạy được trên TV/tất cả máy, không phụ thuộc 1 trình duyệt).
- ✅ Nút **Tải từ Sheet / Đẩy lên Sheet** ở tab ⚙️ Quản trị của game.
- ✅ Bảng vinh danh 3D tự động cập nhật Top 1–2–3.

---

## 📁 File trong thư mục

| File | Vai trò |
|---|---|
| `Code.gs` | Mã Apps Script (dán vào editor) |
| `README.md` | Hướng dẫn này |

---

## 🚀 Cài đặt (làm 1 lần, ~5 phút)

### Bước 1 — Tạo Google Sheet
1. Vào [sheets.new](https://sheets.new) → tạo workbook mới (đặt tên ví dụ `An Toan Duoi Nuoc`).

### Bước 2 — Mở Apps Script
2. Trong Sheet: menu **Extensions** → **Apps Script**.
3. Xoá nội dung file `Code.gs` đang có, **dán toàn bộ** nội dung file `apps-script/Code.gs` vào.

### Bước 3 — Tạo 4 tab + dữ liệu mẫu
4. Trong editor, chọn hàm `setup` ở dropdown (gần nút Run ▶️) rồi bấm **Run**.
   - Lần đầu xuất hiện hộp thoại **cấp quyền (authorize)** → chọn tài khoản → **Advanced** → **Go to ...** → **Allow**.
   - Sau đó, Sheet sẽ có **4 tab**: `Cau_Hoi`, `Hoc_Sinh`, `Lich_Su_Diem`, `Cai_Dat` + dữ liệu mẫu (5 câu, 3 học sinh, cài đặt mặc định).

> 💡 4 tab này là chuẩn của game. Bạn có thể sửa trực tiếp trong Sheet — game đọc theo đúng thứ tự header.

### Bước 4 — Deploy Web App
5. Bấm nút **Deploy** → **New deployment** (có biểu tượng răng cưa).
6. Chọn **Type: Web app**.
7. Cấu hình:
   - **Description**: `v1`
   - **Execute as**: `Me`
   - **Who has access**: **Anyone** ⚠️ *(bắt buộc — nếu chọn "Anyone within Google" thì game từ máy khác/TV sẽ bị chặn)*
8. Bấm **Deploy**, copy **Web app URL** (kết thúc bằng `/exec`).

> ⚠️ Mỗi lần sửa `Code.gs`: **Deploy → Manage deployments → ✏️ (edit) → Version: New version → Deploy** để áp dụng.

---

## 🔗 Kết nối game với Web App

1. Mở game `game_01_Bat_dau.html`.
2. Bấm nút ⚙️ (góc trên) → nhập **mã quản trị** (mặc định: `MN2026`).
3. Vào tab **🌐 Google Sheet** → dán **URL Web App** vào ô "URL Web App Google Apps Script".
4. Bấm **⬇ Tải từ Sheet** → câu hỏi/điểm/cài đặt được nạp vào game.
5. Khi có điểm mới, nút **⬆ Đẩy lên Sheet** (hoặc tự động nếu bật `autoPush`) sẽ ghi lên tab `Lich_Su_Diem`.

---

## 🗂️ Cấu trúc 4 tab (header cố định)

### `Cau_Hoi` — Ngân hàng câu hỏi
| id | text | image | emoji | options | correct | explain |
|---|---|---|---|---|---|---|
| q1 | Câu hỏi... | link_ảnh | 🐯 | `["A","B","C","D"]` *(JSON)* | 0 | Lời giải thích |

- `options`: mảng 4 đáp án, lưu **dưới dạng JSON string**.
- `correct`: số chỉ đáp án đúng (0=A, 1=B, 2=C, 3=D).

### `Hoc_Sinh` — Danh sách học sinh
| id | name | avatar |
|---|---|---|
| s1 | Bé Lan | 🦊 |

### `Lich_Su_Diem` — Lịch sử lượt chơi (bảng xếp hạng)
| id | studentId | name | avatar | stars | combo | timeMs | at |
|---|---|---|---|---|---|---|---|
| 1700..._s1 | s1 | Bé Lan | 🦊 | 8 | 3 | 95000 | 1700... |

- `at`: thời gian (Unix ms). `id`: duy nhất mỗi lượt chơi (game tự sinh).

### `Cai_Dat` — Cài đặt (key / value)
| key | value |
|---|---|
| gameTitle | Phòng Tránh Đuối Nước Cho Bé |
| questionsCount | 10 |
| countdown | true |
| seconds | 30 |
| pin | MN2026 |
| sound | true |
| autoPush | true |
| ttsRate | 0.9 |
| ttsVoice | |

---

## 🌐 API (đúng chuẩn game)

### GET `?action=pull`
Trả về toàn bộ dữ liệu JSON:
```json
{
  "questions": [ ... ],
  "students":  [ ... ],
  "scores":    [ ... ],
  "settings":  { ... },
  "_meta":     { "service":"AnToanDuoiNuoc", "time":"..." }
}
```

### POST (body: JSON, `Content-Type: text/plain`)
```json
{ "action": "push_scores", "records": [ { "id":"...", "studentId":"s1", "name":"Bé Lan", "avatar":"🦊", "stars":8, "combo":3, "timeMs":95000, "at":1700... } ] }
```
Trả về: `{ "ok": true, "message": "..." }`

> `push_scores` dùng **upsert theo `id`** — ghi nhiều lần không tạo bản trùng.

### Các action phụ
- `GET ?action=test` → kiểm tra kết nối: `{ ok:true, message:"..." }`
- `GET ?action=setup` → tạo lại 4 tab + seed dữ liệu mẫu (bỏ qua dữ liệu cũ)
- `POST { action:'push_all', questions, students, scores, settings }` → ghi đồng bộ toàn bộ (tuỳ chọn)

---

## 🛠️ Troubleshoot

| Lỗi | Nguyên nhân / cách xử lý |
|---|---|
| `Đã tải ... câu / 0 điểm` dù Sheet có dữ liệu | Check lại **Who has access = Anyone**; sau khi sửa code phải **Deploy → New version**. |
| `Lỗi tải: Failed to fetch` (CORS) | Game gọi Web App bằng `text/plain` (không cần preflight) → thường do sai URL (thiếu `/exec`) hoặc Web App chưa deploy "Anyone". |
| Web App trả về trang HTML "This page requires authorization" | Chưa cấp quyền ở Bước 3, hoặc deploy với "Anyone within Google" — đổi sang **Anyone**. |
| Điểm bị trùng khi push nhiều lần | Không xảy ra (upsert theo `id`). Nếu vẫn lo, mở tab `Lich_Su_Diem` xoá hàng trùng theo `id`. |
| Muốn reset dữ liệu | Chạy lại `setup` (hoặc `GET ?action=setup`) — xoá & seed lại 4 tab. |
| Muốn thêm câu hỏi trực tiếp Sheet | Thêm dòng vào `Cau_Hoi`, `options` phải là JSON string: `["...","...","...","..."]`. |

> 💡 Nếu dùng trên **TV tương tác / máy trường**: truy cập game qua mạng, Web App chạy trên cloud nên nhiều thiết bị cùng dùng 1 Sheet — điểm tự cập nhật cho cả lớp.

---

## 🔒 Bảo mật
- Web App **không có user auth** (chạy "Anyone") để game gọi được. Dữ liệu chỉ là giáo dục nội bộ; tránh lưu thông tin cá nhân nhạy cảm.
- Mã quản trị `pin` (mặc định `MN2026`) chỉ chặn học sinh mở tab ⚙️, **không phải** bảo mật thật — vẫn nên thay `pin` trong tab `Cai_Dat`.
