# PRD — AI Content Planner (Internal Tool)

## 1. Overview

AI Content Planner adalah internal tool berbasis web untuk merencanakan dan mengelola konten menggunakan AI.

Aplikasi ini memungkinkan pengguna untuk:
- Menghasilkan jadwal konten secara otomatis dengan AI
- Mengelola content plan (tambah, edit, hapus item)
- Melacak waktu pengerjaan konten
- Chat dengan AI untuk strategi konten
- Admin mengelola user dan konfigurasi AI model

**Target pengguna:** Tim internal (bukan produk publik / tidak ada monetisasi).

---

## 2. Product Goals

- Mempercepat proses perencanaan konten bulanan/mingguan
- Memberikan satu tempat terpusat untuk semua item content plan
- Memudahkan tracking status dan waktu pengerjaan konten

---

## 3. Core Features

### 3.1 Content Plan Manager

Pengguna dapat melihat, membuat, mengedit, dan menghapus item content plan.

Setiap item memiliki field:
- `week_label` — label minggu (contoh: "Minggu 1")
- `date` — tanggal posting (format: DD/MM/YYYY)
- `day` — nama hari
- `topic` — topik konten
- `format` — format konten (Single Post, Carousel, Reels)
- `headline` — judul / headline konten
- `visual_description` — deskripsi visual
- `content_body` — isi konten
- `hook_caption` — hook / caption pembuka
- `scheduled_time` — jam posting
- `status` — To Do / In Review / Done
- `notes` — catatan tambahan

Semua item content plan dapat dilihat oleh seluruh pengguna (shared view).

---

### 3.2 AI Schedule Generator

AI dapat membuat jadwal konten otomatis menggunakan wizard berbasis langkah.

#### Input (via wizard)

**Step 1 — Preset (opsional):**
- Awareness, Selling, atau Engagement preset dengan default yang sudah dikonfigurasi

**Step 2 — Konfigurasi:**
- Platform (Instagram / TikTok / LinkedIn)
- Niche bisnis
- Content idea / tema campaign
- Tone (Edukatif / Promosi / Entertaining / Inspiratif / Story Telling)
- Target audience
- Jumlah konten per minggu
- Durasi (minggu)
- Start date

**Step 3 — Preview:**
- Pengguna dapat mereview hasil generate sebelum disimpan

#### Output

AI menghasilkan daftar item content plan yang siap disimpan ke database. Output di-stream secara real-time via SSE (Server-Sent Events).

Contoh output per item:

```
Week: Minggu 1
Date: 21/04/2026
Day: Selasa
Topic: Pentingnya Konsistensi Konten
Format: Carousel
Headline: 5 Alasan Konsistensi Konten Itu Penting
Hook: Brand yang konsisten tumbuh 3x lebih cepat
Scheduled Time: 09:00
Status: To Do
```

---

### 3.3 AI Content Idea Generator

Pengguna dapat menghasilkan ide konten berdasarkan input berikut:
- Niche bisnis
- Platform
- Goal konten
- Target audience
- Jumlah ide (1–10)

Output per ide: judul, hook, format, caption draft, CTA.

---

### 3.4 Time Tracker

Pengguna dapat melacak waktu pengerjaan secara manual.

- Input: tanggal, waktu mulai, waktu selesai
- Output: durasi dalam menit
- Data disimpan per user

---

### 3.5 AI Chat Assistant

Pengguna dapat chat bebas dengan AI untuk strategi konten.

Contoh penggunaan:
- "Buatkan 10 ide konten untuk brand skincare di Instagram"
- "Bagaimana meningkatkan engagement di TikTok?"

---

### 3.6 Admin Panel

Hanya dapat diakses oleh superuser.

Fitur:
- Manajemen user (lihat semua user, toggle role admin/superuser)
- Konfigurasi AI model aktif (via `AppSetting`)
- Registrasi user baru dikendalikan dari sini (jika dibatasi)

---

## 4. User Flow

### Flow Utama

```
Login
↓
Dashboard (overview content plan minggu ini)
↓
Schedule Page → Generate dengan AI atau Tambah Manual
↓
Preview hasil → Simpan ke content plan
↓
Kelola item (edit status, edit konten, hapus)
```

### Daily Usage

```
Buka Dashboard
↓
Cek item minggu ini
↓
Update status item (To Do → In Review → Done)
↓
(Opsional) Track waktu pengerjaan
```

---

## 5. Tech Stack

### Frontend

Next.js (App Router) — UI, dashboard, content planner, AI chat interface

Libraries: TanStack Query, shadcn/ui, date-fns, react-datepicker

### Backend

Next.js Route Handlers (serverless) — REST API, auth, AI orchestration

### Database

PostgreSQL + Prisma ORM

### Authentication

JWT — disimpan di `sessionStorage` + cookie (untuk middleware)

### AI Integration

OpenRouter API — gateway untuk model AI. Default model: `google/gemini-2.5-flash`. Model aktif dikonfigurasi via `AppSetting`.

### Deployment

Vercel

---

## 6. Database Schema

### User

```
id
email
password_hash
is_superuser  — platform-level admin
is_admin      — admin biasa
created_at
```

### ContentPlanItem

```
id
user_id       — siapa yang membuat item ini
week_label
date          — DD/MM/YYYY
day
topic
format
headline
visual_description
content_body
hook_caption
scheduled_time
status        — To Do / In Review / Done
notes
sort_order
created_at
updated_at
```

### TimeEntry

```
id
user_id
date          — YYYY-MM-DD
start_time
end_time
duration      — menit
created_at
```

### AppSetting

```
id
key           — contoh: "active_ai_model"
value
updated_at
```

---

## 7. API Endpoints

### Authentication

```
POST /api/auth/register
POST /api/auth/login
```

### Content Plan

```
GET    /api/content-plan          — semua item (semua user)
POST   /api/content-plan          — buat satu item
POST   /api/content-plan/batch    — buat banyak item sekaligus (dari AI generate)
GET    /api/content-plan/:id      — detail satu item
PATCH  /api/content-plan/:id      — update item
DELETE /api/content-plan/:id      — hapus item
```

### Time Entries

```
GET    /api/time-entries
POST   /api/time-entries
PATCH  /api/time-entries/:id
DELETE /api/time-entries/:id
```

### AI

```
POST /api/ai/generate-content          — generate ide konten
POST /api/ai/generate-schedule         — generate jadwal (non-streaming)
POST /api/ai/generate-schedule-stream  — generate jadwal (SSE streaming)
POST /api/ai/predict-task              — prediksi durasi task
POST /api/ai/chat                      — free-form chat
```

### Admin

```
GET    /api/admin/users           — daftar semua user
PATCH  /api/admin/users/:userId   — update role user
GET    /api/admin/settings        — baca app settings
PATCH  /api/admin/settings        — update app settings (termasuk AI model)
```

---

## 8. Security

- JWT authentication (Bearer token di header)
- Password hashing dengan bcrypt
- Superuser-only access untuk admin endpoints
- Rate limiting AI requests (via middleware atau konfigurasi Vercel)
