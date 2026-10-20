# 🎓 Educational Platform — Frontend

The **React single-page application** for the [Educational Platform](https://github.com/MahmoudMokhtar21/Educational-Platform-one-instructor-). Built with **React 19, TypeScript, and Vite**, it consumes the ASP.NET Core + MongoDB backend API. In production the backend serves the built SPA from its `wwwroot`, so API calls stay same-origin.

---

## ✨ Features

### 🌐 Public pages
* Home page
* Courses catalog with search and filtering
* Course details
* Knowledge articles hub and article details
* Videos hub and video details
* Consultation request page
* About page

### 🔐 Authentication & accounts
* Register, login, and logout
* Email verification
* Forgot / reset password flow
* Profile and account management
* Personal dashboard

### 🎓 Learning
* Learning page with lesson progress tracking
* Course content access for enrolled students

### 🛠️ Admin panel
* Admin dashboard with statistics
* Course management (create, edit, reorder lessons)
* Categories and course access codes
* Videos, articles, and sponsors management
* Consultation requests
* Site settings
* Student reviews moderation

## 🧰 Tech Stack

* **React 19** with **TypeScript**
* **Vite 6** (dev server + production build)
* **React Router 7** (client-side routing, deep-link ready)
* **Axios** (API client)
* Hand-written CSS

## 🚀 Getting Started

Prerequisites: **Node.js 18+** and npm.

```bash
npm install
npm run dev        # starts the dev server on http://localhost:5173
```

In development the app calls the backend at `https://localhost:7031/api` by default (see `VITE_API_URL` below).

### Ngrok development

To test payment flows end-to-end, the backend and frontend must share a public origin. Copy `.env.example` to `.env.local` and set your ngrok host so the Vite dev server accepts it:

```bash
cp .env.example .env.local
# then edit .env.local:
# VITE_ALLOWED_HOSTS=your-ngrok-subdomain.ngrok-free.dev
```

## 🔧 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | No | API base URL. Defaults to `/api` in production builds and `https://localhost:7031/api` during development. |
| `VITE_ALLOWED_HOSTS` | Dev only | Comma-separated hosts allowed to access the Vite dev server (your ngrok domain). |

> Never commit real environment values — `.env.local` is gitignored; only `.env.example` (placeholders) is tracked.

## 📦 Build & Deployment

```bash
npm run build      # type-checks (tsc -b) then builds to dist/
npm run preview    # preview the production build locally
```

Deployment model: the built SPA is served by the ASP.NET Core backend from `wwwroot` (with an `index.html` fallback for deep links), and API requests use the same origin (`/api`). After frontend changes:

1. `npm run build`
2. Copy `dist/*` into the backend's `wwwroot/`
3. Commit the updated `wwwroot` assets on the backend repo when deploying

## 📁 Project Structure

```
src/
├── api/         # Axios client and API services
├── assets/      # Static assets
├── components/  # Reusable UI components
├── context/     # React context (auth state, etc.)
├── layouts/     # Page layouts
├── pages/       # Route pages (public, account, admin)
├── types/       # TypeScript models
├── utils/       # Helpers
├── App.tsx      # Router setup
└── main.tsx     # App entry
```

## 📜 Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Serve the production build locally |

## 🔗 Related

* **Backend API:** [Educational-Platform-one-instructor-](https://github.com/MahmoudMokhtar21/Educational-Platform-one-instructor-) — ASP.NET Core 8 + MongoDB, serves this SPA in production.
