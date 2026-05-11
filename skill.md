# Spesifikasi Kebutuhan Proyek: Aplikasi Quiz Online (Modern Minimalist)

## 1. Tech Stack & Architecture
- **Frontend Framework:** Next.js (App Router / Pages Router) dengan React.
- **Styling:** Tailwind CSS (untuk pendekatan UI/UX modern minimalis) dipadukan dengan komponen seperti Shadcn UI atau Headless UI.
- **Backend & Database:** Supabase (PostgreSQL, Edge Functions jika diperlukan untuk kalkulasi nilai yang aman, dan Supabase Auth/RLS untuk Admin).
- **State Management:** Zustand atau React Context (untuk *timer* soal dan status jawaban lokal).

---

## 2. Fitur Core / Fungsionalitas Utama

### A. Manajemen Soal (Question Engine)
- **Tipe Soal:** Mendukung Pilihan Ganda (PG) dan Essay.
- **Sistem Penilaian (Scoring):** 
  - Kustomisasi bobot poin per soal.
  - Mendukung nilai minus (penalti) untuk jawaban salah, dan nilai plus untuk jawaban benar.
- **Timer Per-Soal (Isolated Timer):** 
  - Setiap soal memiliki batas waktunya sendiri (misal: 60 detik).
  - **Fitur Pause/Resume:** Jika *user* *skip* soal, *timer* untuk soal tersebut berhenti (di-pause) dan akan berjalan kembali dari sisa waktu terakhir saat soal tersebut dibuka lagi.
- **Bonus Waktu:** Sistem otomatis memberikan poin tambahan (*time bonus*) berdasarkan persentase sisa waktu pengerjaan per soal jika jawaban benar.
- **Status/Flagging Soal:** Setiap soal memiliki status visual:
  - 🟢 **Selesai:** Sudah dijawab dan diyakini benar.
  - 🟡 **Ragu-ragu:** Sudah atau belum dijawab, namun ditandai untuk ditinjau ulang.
  - ⚪ **Tidak Diisi/Kosong:** Belum disentuh atau belum dijawab.
- **Navigasi Interaktif:** *Sidebar* atau *bottom bar* berisi grid nomor soal dengan warna yang merepresentasikan status (Selesai, Ragu, Tidak Diisi).

### B. Anti-Cheat & Keamanan (Exam Integrity)
- **Tab/Window Lock:** Memanfaatkan `Page Visibility API`. Jika peserta ujian berpindah tab, membuka jendela lain, atau *minimize* browser, sistem akan memberikan peringatan atau langsung menghentikan ujian (sesuai konfigurasi).
- **Pencegahan Refresh:** *State* ujian (sisa waktu per soal, jawaban tersimpan) disimpan secara *real-time* ke *local storage* atau Supabase, sehingga aman dari *refresh* halaman.

---

## 3. Alur Pengguna (User/Peserta Ujian)

1. **Akses Tanpa Login (PIN-Based Access):**
   - Peserta tidak perlu membuat akun atau login.
   - Akses ujian hanya membutuhkan **Nama Lengkap** (Mandatory) dan **PIN Sesi Ujian** yang diberikan oleh Admin.
2. **Pengerjaan Ujian:**
   - Peserta menavigasi soal melalui grid navigasi.
   - Peserta dapat memilih secara bebas soal yang belum dikerjakan atau yang di-flag "Ragu-ragu".
3. **Pre-Submit Summary:**
   - Sebelum menekan tombol "Submit Final", sistem menampilkan ringkasan/tabel status (Jumlah soal dijawab, tidak dijawab, ragu-ragu).
   - Peserta dikonfirmasi ulang sebelum hasil benar-benar dikirim.

---

## 4. Alur Admin (Dashboard Manajemen)

1. **Manajemen Sesi & Akses:**
   - Admin membuat sesi ujian (*Exam Session*).
   - Sistem men-generate **PIN unik** untuk setiap sesi ujian (misal: `MATH-01-XYZ`). PIN ini yang akan dibagikan ke peserta.
2. **Manajemen Soal (Question Builder):**
   - Admin membuat/mengedit soal secara detail.
   - Input untuk soal: Teks soal, Tipe (PG/Essay), Opsi Jawaban (jika PG), Poin Benar, Poin Salah (Minus), dan Alokasi Waktu per soal (dalam detik).
3. **Monitoring & Rekapitulasi (Leaderboard/Reports):**
   - Admin dapat melihat rekapan nilai (skor akhir) seluruh peserta dalam suatu sesi ujian.
   - Tabel rekapitulasi mencakup: Nama Peserta, Skor Total (termasuk perhitungan bonus waktu dan minus), serta rincian jawaban (PG & Essay).
   - *Catatan:* Untuk soal Essay, Admin dapat memberikan penilaian manual setelah ujian selesai yang akan dikalkulasi ke skor akhir.

---

## 5. Gambaran Skema Database (Supabase / PostgreSQL)

1. **`exams` (Sesi Ujian):** `id`, `title`, `pin` (unique), `is_active`, `created_at`.
2. **`questions` (Bank Soal):** `id`, `exam_id`, `type` (PG/Essay), `content`, `options` (JSON), `correct_answer`, `point_correct`, `point_wrong`, `time_limit_seconds`.
3. **`participants` (Peserta):** `id`, `exam_id`, `name`, `status` (ongoing/submitted), `total_score`, `joined_at`.
4. **`participant_answers` (Jawaban & State Waktu):** `id`, `participant_id`, `question_id`, `answer_text`, `status_flag` (selesai/ragu/kosong), `time_remaining_seconds`, `is_correct`, `score_earned`.

---

## 6. Target UI/UX (Modern Minimalist)
- **Tipografi & Warna:** Menggunakan font Sans-serif yang bersih (seperti Inter atau Roboto). Palet warna monokromatik (Putih, Abu-abu terang, Hitam) dengan aksen warna fungsional (Biru untuk soal aktif, Kuning untuk ragu-ragu, Hijau untuk selesai, Merah untuk peringatan/waktu habis).
- **Layout Pengerjaan:** 
  - *Header:* Nama Ujian, Nama Peserta, Tombol Submit Final.
  - *Main Content:* Teks soal (terpusat, ukuran font nyaman dibaca), opsi jawaban berupa *card* yang *clickable*, indikator timer progres bar di atas soal.
  - *Sidebar (Desktop) / Bottom Drawer (Mobile):* Grid navigasi nomor soal dan legend warna.
- **Transisi:** Animasi *fade* yang halus saat berpindah antar soal agar terasa cepat (*SPA feel*).