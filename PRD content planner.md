# PRD --- AI Content Planner (Web App)

## 1. Overview

AI Content Planner adalah aplikasi web yang membantu bisnis
merencanakan, mengelola, dan menganalisis konten menggunakan AI.

Aplikasi ini memungkinkan pengguna untuk: - Menghasilkan ide konten
secara otomatis - Membuat content calendar - Mengelola proyek konten -
Melacak waktu pengerjaan konten - Mendapatkan analisis produktivitas -
Menggunakan AI assistant untuk strategi konten

Target utama produk ini adalah **bisnis, tim marketing, dan content
creator profesional**.

------------------------------------------------------------------------

# 2. Product Goals

## Business Goals

-   Membantu bisnis meningkatkan konsistensi konten
-   Menghemat waktu perencanaan konten
-   Memberikan insight produktivitas tim
-   Menyediakan AI assistant untuk strategi konten

## User Goals

User ingin: - Mendapatkan ide konten dengan cepat - Mengatur jadwal
posting - Mengelola tugas konten dalam tim - Mengukur produktivitas
kerja

------------------------------------------------------------------------

# 3. Target Users

## Primary Users

-   Digital marketing team
-   Social media manager
-   Content strategist
-   Startup marketing team
-   Marketing agency

## Secondary Users

-   Freelancer content creator
-   Small business owner
-   Personal brand builder

------------------------------------------------------------------------

# 4. Core Features

## 4.1 AI Content Idea Generator

AI dapat menghasilkan ide konten berdasarkan input pengguna.

### Input

User memasukkan: - niche bisnis - platform (Instagram, TikTok,
LinkedIn) - goal konten - target audience - jumlah ide konten

### Output

AI menghasilkan: - judul konten - hook - format konten - caption draft -
CTA

### Example

    Title: 5 Kesalahan Branding UMKM
    Hook: 90% UMKM gagal branding karena ini
    Format: Instagram Carousel
    CTA: Simpan post ini

AI menggunakan **OpenRouter API** sebagai gateway model.

------------------------------------------------------------------------

## 4.2 AI Content Schedule Generator

AI dapat membuat jadwal konten otomatis.

### Input

-   jumlah konten per minggu
-   platform
-   tema campaign
-   durasi campaign

### Output

Content calendar.

Contoh:

    Week 1
    Mon - Edukasi
    Wed - Storytelling
    Fri - Promotional

    Week 2
    Tue - Tutorial
    Thu - Case Study
    Sat - Behind The Scene

Output ditampilkan dalam **calendar planner**.

------------------------------------------------------------------------

## 4.3 Project Management

User dapat membuat proyek konten.

Contoh:

    Project: Ramadan Campaign
    Duration: 30 Days
    Team: 4 Members
    Platform: Instagram + TikTok

Setiap proyek memiliki: - task list - deadline - assignee - status

### Task Status

-   Backlog
-   In Progress
-   Review
-   Done

------------------------------------------------------------------------

## 4.4 Time Tracker

User dapat melacak waktu pengerjaan task.

### Example

    Task: Edit Video
    Start Timer
    Stop Timer

    Total Time: 2h 15m

Time tracker digunakan untuk: - analisis produktivitas - estimasi durasi
task

------------------------------------------------------------------------

## 4.5 AI Task Prediction

AI dapat memprediksi durasi task berdasarkan histori.

### Example

    Task: Edit Instagram Reel
    Predicted Time: 2 Hours
    Confidence: 82%

Prediksi menggunakan data: - histori task - time tracking - kompleksitas
task

------------------------------------------------------------------------

## 4.6 AI Chat Assistant

User dapat chat dengan AI untuk membantu strategi konten.

### Example Prompt

    Buatkan 30 ide konten untuk brand skincare

atau

    Bagaimana meningkatkan engagement Instagram?

AI dapat memberikan: - ide konten - strategi konten - template caption -
rekomendasi waktu posting

------------------------------------------------------------------------

## 4.7 Productivity Analytics

Dashboard analitik produktivitas.

### Metrics

-   total task completed
-   average task duration
-   productivity score
-   team performance

### Example Insight

    Video editing tasks take 35% longer than predicted.
    Posting consistency dropped 20% this week.

------------------------------------------------------------------------

# 5. User Flow

## Onboarding Flow

    Sign Up
    ↓
    Create Workspace
    ↓
    Create First Project
    ↓
    Generate Content Plan
    ↓
    Start Managing Tasks

## Daily Usage Flow

    Open Dashboard
    ↓
    Check Content Calendar
    ↓
    Work on Tasks
    ↓
    Track Time
    ↓
    Review Analytics

------------------------------------------------------------------------

# 6. Monetization

Model: **Freemium**

## Free Plan

-   1 workspace
-   1 project
-   20 AI generations per month
-   basic analytics

## Pro Plan

-   unlimited projects
-   unlimited AI generation
-   advanced analytics
-   team collaboration
-   priority AI processing

## Team Plan

-   multi workspace
-   team analytics
-   admin role management
-   API access

------------------------------------------------------------------------

# 7. Tech Stack

## Frontend

Next.js

Responsibilities: - UI - dashboard - content planner - AI chat interface

## Backend

Node.js

Responsibilities: - REST API - authentication - AI orchestration -
analytics processing

## Database

PostgreSQL with Prisma ORM

Digunakan untuk menyimpan: - user data - projects - tasks - time
tracking - AI request history

## Deployment

Vercel

Digunakan untuk: - hosting frontend - serverless backend

## AI Integration

OpenRouter API

Digunakan untuk: - ide konten - chat assistant - content scheduling -
task prediction

------------------------------------------------------------------------

# 8. Database Schema (Simplified)

## users

    id
    email
    password_hash
    created_at

## workspaces

    id
    owner_id
    name
    created_at

## projects

    id
    workspace_id
    name
    description
    start_date
    end_date

## tasks

    id
    project_id
    title
    description
    status
    assignee
    deadline

## time_entries

    id
    task_id
    user_id
    start_time
    end_time
    duration

## ai_requests

    id
    user_id
    prompt
    response
    created_at

------------------------------------------------------------------------

# 9. API Endpoints

## Authentication

    POST /auth/register
    POST /auth/login

## Projects

    GET /projects
    POST /projects
    GET /projects/:id

## Tasks

    POST /tasks
    PATCH /tasks/:id
    GET /tasks

## AI

    POST /ai/generate-content
    POST /ai/generate-schedule
    POST /ai/chat
    POST /ai/predict-task

------------------------------------------------------------------------

# 10. Security

-   JWT authentication
-   password hashing (bcrypt)
-   rate limiting AI request
-   workspace-based access control

------------------------------------------------------------------------

# 11. Privacy Model

Mode: **Team Sharing**

Workspace members dapat: - melihat proyek - mengedit task - melihat
analytics

### Roles

-   Owner
-   Admin
-   Member

------------------------------------------------------------------------

# 12. Future Features

Planned improvements: - AI caption generator - AI content performance
prediction - social media API integration - auto posting scheduler -
Slack / Notion integration

------------------------------------------------------------------------

# 13. Success Metrics

Key performance indicators: - Daily active users - AI requests per
user - Projects created per workspace - Retention rate - Paid conversion
rate
