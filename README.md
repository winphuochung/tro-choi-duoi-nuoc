# 🌊 An Toàn Dưới Nước — Game cho bé (PWA)

Trò chơi giáo dục **"Phòng Tránh Đuối Nước Cho Bé"** dạng PWA (Progressive Web App),
chạy **offline 100%**, thiết kế cho máy tính bảng / TV / điện thoại dùng trong lớp học
tiểu học (chuẩn bộ 13 chủ đề, chủ đề 13 = phòng tránh đuối nước).

## 🚀 Chạy dự án

Dự án là file tĩnh (HTML/CSS/JS), không cần build.

### Cách 1 — Chạy local (khuyến nghị để PWA hoạt động đầy đủ)
Bất kỳ HTTP server tĩnh nào cũng được, ví dụ:
```bash
cd duoi-nuoc
# Node
npx serve .
# hoặc Python
python -m http.server 8080
```
Rồi mở `http://localhost:8080` — trang chủ sẽ tự đăng ký Service Worker.

> PWA / Service Worker chỉ hoạt động đầy đủ qua **HTTP(S)**, không chạy với `file://`.

### Cách 2 — Mở trực tiếp
Kép chuột `index.html` (xem nhanh được, nhưng PWA/offline bị hạn chế).

## 📁 Cấu trúc
```
duoi-nuoc/
├─ index.html          # Cổng PWA (splash → thư viện)
├─ manifest.json       # PWA: offline/standalone
├─ sw.js               # Service Worker (cache offline)
├─ icon.svg            # Biểu tượng
├─ tts-debug.html      # Kiểm tra giọng TTS
├─ games/
│  ├─ index.html       # Thư viện trò chơi
│  └─ 13_mn_phong_tranh_duoi_nuoc/
│     ├─ index.html    # Trang chủ đề 13
│     ├─ game_01_Bat_dau.html   # ⭐ Game chính
│     └─ img/          # 10 hình minh hoạ (q1–q10)
└─ apps-script/
   ├─ Code.gs          # Backend Google Sheet (Web App)
   └─ README.md        # Hướng dẫn deploy Apps Script
```

## 🗄️ Cơ sở dữ liệu (Google Sheet qua Apps Script)
- Backend nằm trong `apps-script/Code.gs`. Xem `apps-script/README.md` để
  deploy Web App và khai báo 4 tab (`Cau_Hoi`, `Hoc_Sinh`, `Lich_Su_Diem`, `Cai_Dat`).
- Trong game: nút ⚙️ → mã quản trị `MN2026` → tab 🌐 Google Sheet →
  dán **Web App URL** → **Tải từ Sheet / Đẩy lên Sheet**.

## ☁️ Deploy lên GitHub (đồng bộ mã nguồn)
Repo: https://github.com/winphuochung/tro-choi-duoi-nuoc

- **Cài đặt "1-chuột" trên Windows:** chạy file `push-update.bat` → tự
  `git add` + `git commit` + `git push` toàn bộ thay đổi.
- Lệnh chuẩn (môi trường đã cấu hình sẵn):
  ```bash
  git pull --rebase
  # ... sửa mã ...
  git push
  ```
- Alias tiện ích (đã set sẵn trong `.gitconfig`):
  - `git st` = status ngắn, `git pu` = add+commit+push nhanh.

> 💡 Nếu muốn chạy game **online** cho cả lớp qua link (không cần máy chủ),
> bật **GitHub Pages** trong Settings → Pages → chọn nhánh `main` → thư mục gốc.

## 📄 Giấy phép
Dự án giáo dục phi lợi nhuận.
