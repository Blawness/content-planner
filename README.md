# AI Content Planner (Frontend)

Aplikasi web Next.js untuk merencanakan, mengelola, dan menganalisis konten dengan AI sesuai PRD.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Salin env contoh dan atur URL backend:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` dan set `NEXT_PUBLIC_API_URL` ke base URL API backend (misal `http://localhost:3001`).

3. Jalankan development server:
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

## Backend

Frontend memanggil REST API sesuai PRD. Pastikan backend menyediakan:

- `POST /auth/register`, `POST /auth/login`
- `GET/POST /projects`, `GET /projects/:id`
- `GET/POST/PATCH /tasks`
- `POST /ai/generate-content`, `POST /ai/generate-schedule`, `POST /ai/chat`, `POST /ai/predict-task`
- `GET /workspaces`, `POST /workspaces`
- `GET/POST/PATCH /time-entries` (opsional)
- `GET /analytics` (opsional)

Jika backend belum siap, halaman akan menampilkan error/empty state yang sesuai.
