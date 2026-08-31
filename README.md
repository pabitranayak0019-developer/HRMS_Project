# Corporate Employee Management Portal (HRMS)

A complete, production-style **Corporate Employee Management Portal** with Digital ID Cards, Payroll & Attendance System. Built for a BTech major project — full-stack, role-based, and fully functional end-to-end.

## Demo

| Role     | Email                      | Password     |
| -------- | -------------------------- | ------------ |
| HR Admin | `hr@nexuscorp.example`     | `Welcome@123`|
| Manager  | `manager@nexuscorp.example`| `Welcome@123`|
| Employee | `employee@nexuscorp.example`| `Welcome@123`|

> Click a demo account on the login screen to auto-fill credentials.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [System Architecture](#system-architecture)
5. [Database Schema & ER Diagram](#database-schema--er-diagram)
6. [Role-Based Access](#role-based-access)
7. [Installation & Setup](#installation--setup)
8. [Running the Application](#running-the-application)
9. [Environment Variables](#environment-variables)
10. [API Reference](#api-reference)
11. [Payroll Logic](#payroll-logic)
12. [Attendance Rules](#attendance-rules)
13. [Leave Rules](#leave-rules)
14. [Digital ID & QR Verification](#digital-id--qr-verification)
15. [Project Structure](#project-structure)
16. [Screenshots](#screenshots)
17. [Testing & End-to-End Flow](#testing--end-to-end-flow)
18. [Edge Cases Handled](#edge-cases-handled)
19. [Security](#security)
20. [Future Improvements](#future-improvements)

---

## Overview

The portal lets **HR Administrators**, **Managers**, and **Employees** work together on:

- **Attendance** — clock in/out, monthly calendar, automatic status (Present / Half Day / Absent / On Leave / Holiday)
- **Leave management** — apply, balances, approval workflow with notifications
- **Payroll** — salary structures, attendance-aware monthly payroll generation, payslip PDFs
- **Digital Employee ID** — printable card with QR code + public verification page
- **Documents, expenses/reimbursement, performance reviews, holidays, announcements, notifications**

---

## Features

- 🔐 **Auth & RBAC** — JWT auth, bcrypt hashing, protected routes, 3 roles
- 🖥 **Three dashboards** — Employee, Manager (team), HR-Admin (company analytics with Recharts)
- 📅 **Attendance** — clock in/out, late detection, forgot clock-out handling, monthly calendar, history
- 🏖 **Leaves** — 6 types, balance tracking, overlap/date/balance validation, approve/reject with comments
- 💰 **Payroll** — salary structures, proration for mid-month join/exit, absence & unpaid-leave deductions
- 📄 **Payslips** — auto-generated monthly, professional PDF download (PDFKit)
- 🪪 **Digital ID** — front-end preview, QR code (qrcode.react), PDF & PNG download, public `/verify/:id` page
- 📂 **Documents** — HR uploads, employees download (Multer + visibility control)
- 🧾 **Expenses** — submit with receipt, approve/reject by manager/HR
- 🎯 **Performance** — goals, 1–5 ratings, manager comments, acknowledgment
- 🔔 **Notifications** — in-app center, unread badge, mark read/all read, push on events
- 📢 **Announcements** — priority, pin, expiry, attachments
- 🎨 **UI/UX** — dark/light mode, responsive, toasts, modals, confirm dialogs, loading/empty/error states
- 🌱 **Seed data** — looks populated immediately after setup

---

## Tech Stack

**Frontend**

- React 18 + Vite 5 (JavaScript/JSX)
- Tailwind CSS 3 (dark mode, responsive)
- React Router v6, Axios
- Recharts (analytics), Lucide React (icons)
- qrcode.react (QR preview), html2canvas (ID card PNG)

**Backend**

- Node.js + Express 4
- MongoDB + Mongoose 8
- JWT (`jsonwebtoken`), `bcryptjs`
- PDFKit (PDF generation), `qrcode` (QR for PDFs)
- Multer (file uploads), Nodemailer (optional SMTP)
- dotenv, cors, morgan

---

## System Architecture

```
┌───────────────────────────────┐      ┌────────────────────────────────┐
│        Frontend (Vite)        │      │         Backend (Express)      │
│  React SPA @ :5173            │ HTTP │  REST API @ :5000              │
│  ┌──────────┐  ┌───────────┐  │──────▶  controllers → services →     │
│  │ Context  │  │ Services  │  │      │  models                       │
│  │ Auth/    │  │ axios     │  │      │  ┌──────────┐   ┌──────────┐  │
│  │ Theme/   │  │ api.js    │  │      │  │middleware│   │  utils   │  │
│  │ Toast    │  │ (proxy)   │  │      │  │ auth,    │   │ pdf, qr  │  │
│  └──────────┘  └───────────┘  │      │  │ upload.. │   │ date...  │  │
│  pages/layouts/components/ui   │      │  └──────────┘   └──────────┘  │
└───────────────────────────────┘      └───────────────┬────────────────┘
                                                        │  (Mongoose ODM)
                                                        ▼
                                                ┌─────────────────┐
                                                │     MongoDB      │
                                                │    hrms_db       │
                                                └─────────────────┘
```

**Dev proxy:** Vite proxies `/api` and `/uploads` to `http://localhost:5000` (see `vite.config.js`).

---

## Database Schema & ER Diagram

```
┌────────────┐ 1      N ┌─────────────┐ N      1 ┌────────────┐
│ Department │──────────│    User     │──────────│   User     │
│            │          │             │          │ (manager)  │
└────────────┘          └─────────────┘          └────────────┘
       ▲                       │ 1
       │                       │
       │                       ▼ 1
       │                ┌─────────────┐
       │                │ Employee    │  (profile: personal,
       │                │ Profile     │   bank, emergency, photo)
       │                └─────────────┘
       │
       ▼
User (department) ◄── 1:N ── User (employee) ── 1:N ── Attendance
                                 │ 1:N
                                 ├── LeaveRequest ────► (approver: User)
                                 ├── SalaryStructure ──► Payslip (1 month/user unique)
                                 ├── ExpenseClaim ────► (approver: User)
                                 ├── PerformanceReview (manager: User)
                                 └── Notification (recipient: User)

Standalone collections:
  Holiday, Announcement (createdBy: User), Document (uploadedBy: User)
```

### Collections (Mongoose models)

| Model               | Purpose                                                        | Key fields                                                                   |
| ------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `User`              | Login, role, department, manager, employee ID                  | email*, employeeId*, password*, role, department, manager, status            |
| `EmployeeProfile`   | Extended profile                                               | photo, gender, dob, phone, address, bloodGroup, designation, joiningDate, bank{...}, emergencyContact{...}, idCardValidity |
| `Department`        | Departments with head                                          | name*, code, description, head, status                                       |
| `Attendance`        | One record per user per day                                    | user, date*, clockIn, clockOut, workingHours, isLate, lateMinutes, status    |
| `LeaveRequest`      | Leave applications                                             | user, leaveType, duration, startDate, endDate, numberOfDays, reason, status, approver, approvalComment |
| `SalaryStructure`   | Salary components                                              | user, effectiveFrom, basicSalary, hra, allowances..., pf, tax..., virtuals grossSalary/netSalary |
| `Payslip`           | Monthly generated payslip                                      | user, month*, year*, earnings{...}, deductions{...}, attendanceSummary, proratedDays, leaveDeduction, netSalary |
| `Holiday`           | Company/public holidays                                        | name, date, description, type                                                |
| `Announcement`      | Notice board                                                    | title, description, priority, pinned, createdBy, attachment, expiresAt       |
| `Document`          | File registry                                                  | title, category, fileName, filePath, visibility(PUBLIC/PRIVATE), uploadedBy  |
| `Notification`      | In-app notifications                                           | recipient, type, title, message, link, isRead                                |
| `ExpenseClaim`      | Reimbursement                                                  | user, title, category, amount, expenseDate, receiptFile, status, approver    |
| `PerformanceReview` | Appraisals                                                     | user, manager, period, goals[], ratings{...}, comments, status               |

`(* = indexed/unique where appropriate; all models include createdAt/updatedAt)`

---

## Role-Based Access

| Module                 | Employee | Manager | HR Admin |
| ---------------------- | :------: | :------: | :------: |
| Own dashboard / profile| ✔        | ✔        | ✔        |
| Attendance (own)       | ✔        | ✔        | ✔        |
| Apply leave            | ✔        | ✔        | ✔        |
| View payslips / ID     | ✔        | ✔        | ✔        |
| Documents (per access) | ✔        | ✔        | ✔        |
| Submit expenses        | ✔        | ✔        | ✔        |
| Team dashboard / team  | ✘        | ✔        | ✔        |
| Leave / expense approvals | ✘     | ✔ (own team) | ✔ (all) |
| Performance reviews    | view own | ✔ (own team) | ✔ (all) |
| Employees CRUD         | ✘        | view     | ✔        |
| Departments CRUD       | ✘        | ✘        | ✔        |
| Salary / payroll       | view own | view     | ✔        |
| Holidays / announcements / documents upload | ✘ | ✘ | ✔ |

Backend enforces every route with `protect` + `restrictTo` middleware; UI hides unauthorized pages.

---

## Installation & Setup

### Prerequisites

- Node.js 18+ (tested on 24.x)
- MongoDB running locally (`mongod` / MongoDB service on `mongodb://127.0.0.1:27017`)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # Windows: copy .env.example .env
npm run seed                # creates demo data
npm run dev                 # or: npm start
```

API runs on **http://localhost:5000**.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs on **http://localhost:5173** (proxies `/api` to the backend).

### 3. Seed data

```bash
cd backend && npm run seed
```

Wipes and re-creates departments, users, profiles, salaries, holidays, announcements, ~3 months of attendance, leaves, expenses, reviews, documents, notifications, and payslips for the previous 3 months.

---

## Running the Application

| Action            | Command                       |
| ----------------- | ----------------------------- |
| Start backend     | `cd backend && npm run dev`   |
| Seed demo data    | `cd backend && npm run seed`  |
| Start frontend    | `cd frontend && npm run dev`  |
| Build frontend    | `cd frontend && npm run build`|
| Frontend preview  | `cd frontend && npm run preview` |

Open http://localhost:5173 and sign in with any demo account.

---

## Environment Variables

Backend `.env` (see `backend/.env.example`):

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `PORT` | 5000 | API port |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/hrms_db` | MongoDB connection string |
| `JWT_SECRET` | — | JWT signing secret (change in production) |
| `JWT_EXPIRES_IN` | 8h | Access token lifetime |
| `CLIENT_URL` | `http://localhost:5173` | CORS origin + reset/verify link base |
| `SMTP_HOST/PORT/USER/PASS` | empty | Optional Nodemailer SMTP (emails skip gracefully) |
| `UPLOAD_DIR` | uploads | Upload storage folder |
| `MAX_FILE_SIZE_MB` | 10 | Upload size limit |
| `WORK_HOURS_PER_DAY` | 8 | Full-day threshold |
| `WORKING_DAYS_PER_MONTH` | 22 | Fallback working days |
| `LATE_THRESHOLD_MINUTES` | 15 | Late-login threshold |

---

## API Reference

All routes are prefixed with `/api` and use `Authorization: Bearer <token>` except auth & verify.

### Auth
| Method | Route | Description |
| ------ | ----- | ----------- |
| POST | `/auth/login` | Login by email or employee ID (`{identifier, password, rememberMe}`) |
| GET  | `/auth/me` | Current user |
| PUT  | `/auth/change-password` | Change password |
| POST | `/auth/forgot-password` | Request reset link (email) |
| POST | `/auth/reset-password` | Reset with token |

### Employees
| Method | Route | Description |
| ------ | ----- | ----------- |
| GET/POST | `/employees` | List (search/filter) / create (HR) |
| GET/PUT/DELETE | `/employees/:id` | View / update / deactivate (HR) |
| PATCH | `/employees/:id/status` | Activate/deactivate |
| POST | `/employees/:id/photo` | Upload photo (HR) |
| GET/PUT | `/employees/me` | Own profile |
| POST | `/employees/me/photo` | Own photo upload |
| GET | `/employees/managers` | Manager list |

### Departments · Holidays · Announcements
| Method | Route | Description |
| ------ | ----- | ----------- |
| GET/POST | `/departments` | List (all) / create (HR) |
| PUT/DELETE | `/departments/:id` | Update / deactivate (HR) |
| GET/POST | `/holidays` | List / create (HR) |
| PUT/DELETE | `/holidays/:id` | Update / delete (HR) |
| GET/POST | `/announcements` | List / create (HR, optional file) |
| PUT/DELETE | `/announcements/:id` | Update / remove (HR) |

### Attendance
| Method | Route | Description |
| ------ | ----- | ----------- |
| POST | `/attendance/clock-in` | Clock in (handles duplicates/late) |
| POST | `/attendance/clock-out` | Clock out (auto hours + status) |
| GET | `/attendance/today` | Today's status |
| GET | `/attendance/me/month?year=&month=` | Monthly view + calendar |
| GET | `/attendance/team/month` | Team monthly (manager/HR) |
| GET | `/attendance/records` | Paged records |

### Leaves
| Method | Route | Description |
| ------ | ----- | ----------- |
| POST | `/leaves` | Apply (validates dates, overlap, balance) |
| GET | `/leaves/me` | My requests |
| GET | `/leaves/balances` | Balances |
| GET | `/leaves/approvals` | Pending approvals (manager team / all for HR) |
| GET | `/leaves/all` | All requests |
| PUT | `/leaves/:id/review` | Approve / reject + comment |
| POST | `/leaves/:id/cancel` | Cancel request |

### Payroll & Payslips
| Method | Route | Description |
| ------ | ----- | ----------- |
| GET | `/payroll/structure/me` | Own structure |
| POST/PUT/DELETE | `/payroll/structure/:id` | Save / update / deactivate (HR) |
| GET | `/payroll/structures` | All structures (HR) |
| POST | `/payroll/generate` | Generate monthly payroll `{month, year}` (HR) |
| GET | `/payroll/summary` | Monthly payroll summary (HR) |
| GET | `/payslips/me` | My payslips |
| GET | `/payslips/all` | All payslips (HR/manager) |
| GET | `/payslips/:id` | One payslip |
| GET | `/payslips/:id/download` | Payslip PDF |

### Documents · Expenses · Performance
| Method | Route | Description |
| ------ | ----- | ----------- |
| GET/POST | `/documents` | List (visibility-aware) / upload |
| GET | `/documents/:id` | Detail |
| GET | `/documents/:id/download` | Download file |
| DELETE | `/documents/:id` | Remove |
| POST | `/expenses` | Submit claim (with receipt) |
| GET | `/expenses/me` | My claims |
| GET | `/expenses/approvals` / `/expenses/all` | Review lists |
| PUT | `/expenses/:id/review` | Approve / reject |
| GET/POST | `/performance` | List / create review (manager/HR) |
| PUT | `/performance/:id` | Update / acknowledge |
| GET | `/performance/me` | My reviews |

### Notifications · ID Card · Dashboards
| Method | Route | Description |
| ------ | ----- | ----------- |
| GET | `/notifications` | List + unread count |
| GET | `/notifications/unread` | Unread count |
| PUT | `/notifications/:id/read` / `/notifications/read-all` | Mark read |
| GET | `/idcard/me` | My card data |
| GET | `/idcard/:id/pdf` | ID card PDF |
| GET | `/idcard/:id/qr` | Card + QR data URL |
| GET | `/idcard/verify/:id` | **Public** QR verification |
| GET | `/dashboard/employee` / `/manager` / `/admin` | Role dashboards |
| GET | `/health` | Health check |

---

## Payroll Logic

Monthly payroll runs in the backend (`services/payrollService.js`):

1. **Working days** = Mon–Fri business days of the month minus holidays.
2. **Per employee**, the *payable window* is clamped to their **joining date → today/exit date** (mid-month join/exit → prorated).
3. **Attendance summary** built from attendance records, approved leaves and holidays:
   - `presentDays`, `halfDays`, `paidLeaveDays`, `unpaidLeaveDays`, `absentDays`.
4. **Proration factor** = employee business days ÷ month business days.
5. **Gross (prorated)** = structure gross × factor; each earning component is prorated.
6. **Daily rate** = full gross ÷ month business days.
7. **Deductions** = unpaid leave + absence days × daily rate, **plus** prorated fixed deductions (PF, PT, tax, insurance, loan).
8. **Net** = prorated gross − leave/absence deduction − prorated fixed deductions.
9. A `Payslip` is upserted (unique `user+month+year`) and a notification is created.

> Every employee does **not** get the same salary — absence, unpaid leave, holidays and mid-month join/exit all affect the amount.

---

## Attendance Rules

- Clock-in/out creates one record per user per day (`user + date` unique index).
- `workingHours` computed from clock-in→clock-out, capped at 2× the daily threshold.
- **Late** if clock-in after 09:15 (configurable `LATE_THRESHOLD_MINUTES`).
- `< 50%` of daily hours → status **HALF_DAY**; otherwise **PRESENT**.
- Days with approved leave → **ON_LEAVE**; holidays → **HOLIDAY**; past days with no record → **ABSENT**.
- Duplicate clock-in / clock-out returns a clear 400 error (never crashes).
- Forgot clock-out → today shows clocked-in, status stays as computed.

---

## Leave Rules

- Leave types: `SICK_LEAVE` (12/yr), `CASUAL_LEAVE` (12/yr), `PAID_LEAVE` (10/yr), `UNPAID_LEAVE` (unlimited), `HALF_DAY` / `FULL_DAY` (drawn from paid balance).
- Validations: valid/inverted dates, single day for half-day, **no overlap** with pending/approved leave, **sufficient balance**.
- Approval by the employee's manager (or HR when no manager); employee is notified on submit/approve/reject.
- Balance deducted only on approval.

---

## Digital ID & QR Verification

- **ID card** contains company branding, photo, name, employee ID, department, designation, joining date, validity, blood group and a **QR code**.
- QR encodes a signed token (base64url JSON) that links to the **public endpoint** `GET /api/idcard/verify/:id` — it returns employee validity, name, ID, department, designation.
- Employees can download the card as **PDF** (PDFKit) or **PNG** (html2canvas) and open the verification page directly.

---

## Project Structure

```
Major project/
├── backend/
│   ├── config/            # db.js, constants.js
│   ├── controllers/       # auth, employee, department, attendance, leave,
│   │                      # payroll, payslip, holiday, announcement, document,
│   │                      # expense, performance, notification, idcard, dashboard
│   ├── middleware/        # auth, errorHandler, upload, validate
│   ├── models/            # 13 Mongoose models
│   ├── routes/            # Express routers
│   ├── seed/seed.js       # demo data
│   ├── services/          # attendance, leave, payroll, pdf, qr, notification, email
│   ├── utils/             # AppError, asyncHandler, dateUtils, serializer
│   ├── uploads/           # local file storage (gitignored)
│   ├── .env / .env.example
│   └── server.js
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/    # ui/ (Button, Card, Form, Modal, Badge, Feedback,
│       │                  # Pagination, PageHeader) + layout components
│       ├── context/       # AuthContext, ThemeContext, ToastContext
│       ├── hooks/         # useApi, useFetch
│       ├── layouts/       # DashboardLayout, Sidebar, Topbar, NotificationProvider
│       ├── pages/         # auth/ employee/ manager/ admin/ common/ VerifyId
│       ├── services/      # api.js (axios instance)
│       ├── utils/         # format.js
│       ├── App.jsx        # routing + role guards
│       └── main.jsx
├── .gitignore
└── README.md
```

---

## Screenshots

> Add screenshots here for your report/presentation, e.g.:
> - Login page, Employee dashboard, Attendance calendar, Leave approval,
> - Payroll page, Payslip PDF, Digital ID card, Admin analytics.

---

## Testing & End-to-End Flow

The complete project flow works:

```
HR creates employee  →  employee account + profile created (EMP-xxxx, default password)
→ employee logs in   →  views profile, uploads photo
→ digital ID generated (QR + PDF + PNG)
→ employee clocks in → clocks out → hours/status calculated
→ applies for leave  → manager receives + approves → employee notified
→ HR sets salary structure → monthly payroll generated (attendance-aware)
→ payslip generated  → employee downloads payslip PDF
```

### Manual API smoke test (PowerShell)

```powershell
$r = Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/auth/login `
  -ContentType "application/json" -Body '{"identifier":"employee@nexuscorp.example","password":"Welcome@123"}'
$h = @{ Authorization = "Bearer $($r.token)" }
Invoke-RestMethod -Uri http://localhost:5000/api/attendance/today -Headers $h
```

### Health check

```bash
curl http://localhost:5000/api/health
```

---

## Edge Cases Handled

- Duplicate clock-in/out, forgot clock-out, late login
- Overlapping leave, insufficient balance, invalid/inverted dates
- Holiday attendance, mid-month joining/exits, incomplete payroll month
- Unauthorized role access (403), invalid/expired JWT (401), missing profile
- Invalid file types/sizes, duplicate employee ID/email (409)
- Every error returns a JSON response — the app never crashes on bad input.

---

## Security

- bcrypt password hashing, JWT with expiry, role middleware on every protected route
- Input validation on all write endpoints
- Multer file-type/size restrictions; uploads stored outside the repo
- CORS restricted to `CLIENT_URL`
- No secrets in the frontend; `.env` values only in backend; `.env`/uploads gitignored
- `.env.example` provided for safe configuration

> **⚠️ Keep `.env` private.** The real `.env` (with JWT secrets etc.) is **gitignored** and must never be uploaded/submitted.
> When submitting the project, share **only** `.env.example`. The app is designed to **run without `.env`** —
> it falls back to safe development defaults (`config/env.js`) and prints a warning, so a reviewer only needs to
> `copy .env.example .env` (or nothing at all for a local demo) to run it.
>
> For production always set a strong `JWT_SECRET` — never use the development fallback.

---

## Future Improvements

- Email notifications via configured SMTP (already wired with Nodemailer)
- Forgot clock-out auto-close job (cron)
- Pay-slip re-issue & payroll run history
- Bulk employee import (CSV/Excel)
- Two-factor authentication & refresh tokens
- Chat / team messaging, mobile app (PWA)
- Document preview (PDF viewer) instead of download-only

---

## 🚀 Deploy Online (Free)

Deploy the full stack publicly at zero cost:

| Component | Platform | Free |
|---|---|---|
| Database | MongoDB Atlas (M0) | ✅ |
| Backend | Render.com | ✅ |
| Frontend | Vercel | ✅ |

**Step-by-step guide:** See [`DEPLOY.md`](DEPLOY.md)

Quick summary:
1. Create MongoDB Atlas free cluster → get connection string
2. Deploy backend to Render → set `MONGO_URI`, `JWT_SECRET`
3. Seed database via Render Shell: `node seed/seed.js`
4. Deploy frontend to Vercel → set `VITE_API_URL` and `VITE_UPLOADS_URL` to your Render URL
5. Update backend `CLIENT_URL` with your Vercel URL

Total cost: **₹0** (all free tiers)
