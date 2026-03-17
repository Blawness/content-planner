# AI Content Planner (Frontend)

Aplikasi web Next.js untuk merencanakan, mengelola, dan menganalisis konten dengan AI sesuai PRD.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Salin env contoh dan atur variabel:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local`:
   - **DATABASE_URL**: connection string PostgreSQL (Neon atau lokal).
   - **JWT_SECRET**: secret untuk JWT (min 32 karakter).
   - **NEXT_PUBLIC_API_URL**: kosongkan untuk pakai backend dalam repo (`/api`); isi jika backend dipisah.

3. Jalankan migrasi database (setelah `DATABASE_URL` dan `JWT_SECRET` diisi):
   ```bash
   npm run db:migrate
   ```

4. Jalankan development server:
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000).

## Fitur

- **Auth**: Login / Register (JWT), onboarding workspace + proyek pertama
- **Dashboard**: Ringkasan proyek, task selesai, productivity score
- **Projects & Tasks**: Daftar proyek, detail proyek dengan task per status (Backlog, In Progress, Review, Done), tambah/ubah status task
- **AI Content Ideas**: Form niche, platform, goal, audience → generate ide (judul, hook, format, caption, CTA)
- **AI Schedule**: Generate jadwal konten per minggu → tampilan calendar
- **Time Tracker**: Pilih task, start/stop timer, riwayat durasi
- **AI Chat**: Chat dengan AI untuk strategi konten
- **AI Task Prediction**: Prediksi durasi task di card task (confidence %)
- **Analytics**: Total task selesai, rata-rata durasi, productivity score, insight

## Tech Stack

- Next.js 14 (App Router), TypeScript, Tailwind CSS
- TanStack Query untuk data fetching
- Auth via context + sessionStorage + cookie (untuk middleware)

## Backend (Next.js Route Handlers + Prisma + PostgreSQL)

Backend berjalan di repo yang sama sebagai Route Handlers (`app/api/`), dengan Prisma dan PostgreSQL (Neon).

Setelah mengatur `DATABASE_URL` dan `JWT_SECRET`, jalankan migrasi:
```bash
npm run prisma:generate
npm run db:migrate
```

Endpoint yang disediakan:
- `POST /api/auth/register`, `POST /api/auth/login`
- `GET/POST /api/workspaces`
- `GET/POST /api/projects`, `GET /api/projects/:id`
- `GET/POST/PATCH /api/tasks`
- `GET /api/health` (cek koneksi DB)
- (Rencana: AI, time-entries, analytics)
