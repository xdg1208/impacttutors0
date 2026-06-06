# Impact Tutors - Premium Learning Management System

Impact Tutors is a professional, high-performance web application designed for a bespoke tutoring business. It features a robust Next.js frontend and a scalable Django REST Framework backend, providing a seamless experience for students, parents, and tutors.

## 🚀 Key Features

### 🔐 Multi-Role Access Control

- **Admin Dashboard**: Centralized hub for managing student/tutor applications, registration codes, courses, and live sessions. Includes global search and performance-tuned filtering.
- **Student Dashboard**: Personalized view of upcoming classes, performance tracking, and course materials.
- **Tutor Dashboard**: Dedicated interface for managing assigned students and scheduling sessions.

### 📝 Secure Onboarding Flow

- **Registration Codes**: Unique, role-specific invite codes are required for signups, ensuring a vetted user base.
- **Unified Applications**: Integrated queues for both student and tutor applications with automated workflows for approval and enrollment.

### 🎨 Premium User Experience

- **Modern UI**: Built with Tailwind CSS and Lucide icons, featuring a sleek dark mode and smooth animations.
- **Mobile Responsive**: Fully optimized for learning on any device.

## 🛠 Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) (App Router), [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/).
- **Backend**: [Django REST Framework](https://www.django-rest-framework.org/), [PostgreSQL](https://www.postgresql.org/) (recommended) / [SQLite](https://www.sqlite.org/) (base).
- **Communication**: Secure API architecture with proxy-based authentication sync.

## 📦 Getting Started

### Prerequisites

- Node.js (v18+)
- Python (v3.10+)

### 1. Backend Setup

```bash
cd backend
python -m venv venv
...
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 3. Environment Configuration

- **Backend**: Copy `backend/.env.example` to `backend/.env`.
- **Frontend**: Copy `frontend/.env.example` to `frontend/.env.local`.
- **Frontend**: Copy `frontend/.env.example` to `frontend/.env.local`.

Backend SendPulse (optional): For password reset OTP emails the backend can use SendPulse. Add the following to `backend/.env` (or set in your hosting env):

```
SENDPULSE_CLIENT_ID=your-sendpulse-client-id
SENDPULSE_CLIENT_SECRET=your-sendpulse-client-secret
SENDPULSE_FROM_EMAIL=no-reply@yourdomain.com
SENDPULSE_FROM_NAME="Impact Tutors"
```

## 🚀 Deployment

### 1. Frontend (Vercel)

- Connect your GitHub repo to [Vercel](https://vercel.com).
- **CRITICAL**: Set the **Root Directory** to `frontend` in the project settings.
- Add `NEXT_PUBLIC_API_URL` to your environment variables.
- **Example**: `https://impact-tutors-backend.onrender.com/api` (ensure it includes `/api`).

### 2. Backend (Render)

This project includes a `render.yaml` blueprint for one-click deployment.

- Create a new "Blueprint Instance" on [Render](https://render.com).
- Connect this repository.
- **Database**: This setup uses the `db.sqlite3` file included in your repository.
- **Warning**: Since the database is part of the repository, any changes made in production will be **OVERWRITTEN** on your next deployment. This is intended for testing only.
- The `backend/build.sh` script handles migrations automatically.

---

Built with passion by Impact Tutors.
