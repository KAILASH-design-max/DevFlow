<div align="center">

# ⚡ DevFlow

**Enterprise Agile Project Management & AI-Powered Engineering Intelligence Platform**

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/Neon_PostgreSQL-Serverless-00E699?style=for-the-badge&logo=postgresql&logoColor=black)](https://neon.tech/)
[![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-EF4444?style=for-the-badge&logo=turborepo)](https://turbo.build/)

<p align="center">
  <a href="#-key-features">Key Features</a> •
  <a href="#-architecture--monorepo-structure">Architecture</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-environment-variables">Environment Setup</a> •
  <a href="#-security--rbac-matrix">Security & RBAC</a> •
  <a href="#-testing">Testing</a> •
  <a href="#-license">License</a>
</p>

</div>

---

## 📖 Overview

**DevFlow** is a modern, high-velocity agile project tracking and engineering metrics platform built for software development teams. Designed as an enterprise-ready alternative to Jira and Linear, DevFlow combines fluid real-time Kanban and Scrum workflows with native AI generation, GitHub sync, multi-tenant workspace isolation, and DORA metrics.

---

## ✨ Key Features

### 📋 Agile Sprint & Kanban Management
- **Interactive Kanban Board**: Drag-and-drop workflow status cards (`BACKLOG`, `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`) with immediate optimistic updates.
- **Scrum Sprint Lifecycle**: Create, start, complete, and track multi-week sprints with velocity analytics and burndown indicators.
- **Deep Issue Catalog**: Rich markdown descriptions, custom labels, assignees, story point estimates, priority tiers (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), and sub-task checklists.
- **Audit Logs & Work History**: Granular event audit logs for every status transition, assignment change, and comment.

### 🤖 AI-Powered Engineering Intelligence
- **Smart Story & Subtask Breakdown**: Instantly decompose complex feature requests into actionable engineering tickets using Google Gemini AI.
- **Sprint Risk Analysis**: Automated detection of scope creep, blocker dependencies, and deadline risks.
- **AI Pull Request & Commit Summaries**: Auto-generate release notes and changelogs from linked GitHub PRs.

### 🛡️ Enterprise Security & Multi-Tenancy
- **5-Tier Role-Based Access Control (RBAC)**: Enforces permission boundaries across `ADMIN`, `PROJECT_MANAGER`, `DEVELOPER`, `TESTER`, and `VIEWER`.
- **Tenant Isolation & IDOR Protection**: Scoped workspace boundaries prevent cross-tenant data leaks and unauthorized entity access.
- **Two-Factor Authentication (2FA)**: Time-based One-Time Password (TOTP) authenticator app support with encrypted backup recovery codes.
- **Secure Email OTP Authentication**: Passwordless one-time passcode login and verification dispatched via high-reputation SMTP (Gmail / Custom SMTP).

### 📊 DORA & Engineering Analytics
- **Lead Time for Changes**: Measure cycle time from first commit to deployment.
- **Deployment Frequency**: Real-time visibility into production release velocity.
- **Change Failure Rate & MTTR**: Track rollbacks, bug densities, and system incident resolution times.

### 🔗 Integrations & Real-Time Sync
- **GitHub Sync**: Webhook receiver for real-time tracking of commits, branches, pull requests, and automated issue closing.
- **Live Collaboration**: WebSocket and SSE events ensure boards and issue views remain synchronized across team members without manual refreshes.
- **Multi-Workspace Switcher**: Instant switching between multiple engineering organizations and workspaces.

---

## 🏗 Architecture & Monorepo Structure

DevFlow is organized as an enterprise Turborepo monorepo powered by `pnpm`:

```text
devflow/
├── apps/
│   ├── api/                 # Express + TypeScript REST API backend
│   │   ├── src/config/      # Database, Firebase Admin, and JWT configurations
│   │   ├── src/middleware/  # Auth, RBAC, IDOR guards, and rate limiters
│   │   ├── src/modules/     # Auth, Workspaces, Projects, Issues, Sprints, AI, GitHub
│   │   └── src/security/    # Security event logger, permission engine, and audit handlers
│   ├── web/                 # Next.js 15 (Turbopack) frontend application
│   │   ├── src/app/         # App Router: Dashboard, Board, Issues, Projects, Settings
│   │   ├── src/components/  # Modals, Kanban columns, PermissionGate, and UI widgets
│   │   ├── src/context/     # AuthContext and state providers
│   │   └── src/hooks/       # usePermissions, useRealtime, and data hooks
│   └── cli/                 # DevFlow Developer CLI utility
├── packages/
│   ├── database/            # Neon PostgreSQL Prisma schema, client, and seeds
│   ├── shared/              # Cross-package TypeScript interfaces, DTOs, and Zod schemas
│   └── tests-e2e/           # Automated end-to-end security and API test suites
├── .gitignore               # Root exclusion rules (strictly ignores all secrets & keys)
├── .env.example             # Clean environment configuration template
├── pnpm-workspace.yaml      # Monorepo workspace configuration
└── turbo.json               # Turbo pipeline build and caching graph
```

---

## 💻 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | [Next.js 15](https://nextjs.org/) (Turbopack, App Router), [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), Lucide Icons, Headless UI |
| **Backend** | [Express](https://expressjs.com/), [TypeScript](https://www.typescriptlang.org/), [Zod](https://zod.dev/), [Argon2](https://github.com/ranisalt/node-argon2), [JWT](https://jwt.io/), [Nodemailer](https://nodemailer.com/) |
| **Database & ORM** | [Neon](https://neon.tech/) Serverless PostgreSQL, [Prisma ORM 6.19](https://www.prisma.io/) |
| **AI Integration** | Google Gemini Generative AI SDK |
| **DevOps & Tooling** | [Turborepo](https://turbo.build/), [pnpm](https://pnpm.io/), Docker Compose |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **Package Manager**: `pnpm` (`v9.x` or higher) — `npm install -g pnpm`
- **Database**: A running [Neon PostgreSQL](https://neon.tech) database or local PostgreSQL instance.

---

### 1. Clone the Repository

```bash
git clone https://github.com/KAILASH-design-max/DevFlow.git
cd DevFlow
```

### 2. Install Monorepo Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Copy the example environment template into `.env` at the root and in the respective apps:

```bash
cp .env.example .env
cp .env.example apps/api/.env
```

Create `apps/web/.env.local` for the Next.js client:

```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

> ⚠️ **Important**: Never commit `.env` or `.env.*` files. DevFlow's `.gitignore` protects all credentials by default.

### 4. Initialize Database Schema

Push the Prisma schema to your PostgreSQL database and generate the Prisma Client:

```bash
# Push schema migrations to database
pnpm --filter @devflow/database db:push

# Generate typed Prisma client
pnpm --filter @devflow/database db:generate
```

*(Optional) Seed default enterprise test organizations and accounts:*
```bash
pnpm --filter @devflow/database db:seed
```

### 5. Run DevFlow Locally

Run all packages simultaneously with hot-reloading:

```bash
pnpm run dev
```

The services will be available at:
- 🌐 **Web Frontend**: [http://localhost:3000](http://localhost:3000)
- 🔌 **API Server**: [http://localhost:4000](http://localhost:4000)
- 📡 **Health Check**: [http://localhost:4000/health](http://localhost:4000/health)

---

## ⚙️ Environment Variables Reference

| Variable | Description | Required | Example |
| :--- | :--- | :---: | :--- |
| `DATABASE_URL` | Pooled connection string for Prisma application queries | Yes | `postgresql://user:pass@ep-xyz-pooler.neon.tech/neondb?sslmode=require` |
| `DIRECT_URL` | Direct unpooled connection string for schema migrations | Yes | `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | Secret key used to sign and verify internal access tokens | Yes | `your_super_secret_jwt_key` |
| `JWT_ACCESS_EXPIRY` | Expiration window for access tokens | No | `15m` |
| `JWT_REFRESH_EXPIRY` | Expiration window for refresh tokens | No | `7d` |
| `PORT` | HTTP port for the Express backend API server | No | `4000` |
| `CORS_ORIGIN` | Allowed web frontend origin for cross-origin requests | Yes | `http://localhost:3000` |
| `SMTP_HOST` | SMTP server hostname for sending email OTP codes | No | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | No | `465` |
| `SMTP_USER` | Email address used for authentication with SMTP server | No | `security@yourdomain.com` |
| `SMTP_PASS` | App Password or SMTP token | No | `your-16-char-app-password` |
| `EMAIL_FROM` | Sender display name and email address for system emails | No | `"DevFlow Security" <security@yourdomain.com>` |
| `GEMINI_API_KEY` | Google Gemini API key for AI feature breakdowns | No | `AIzaSy...` |
| `GITHUB_WEBHOOK_SECRET`| Secret used to verify GitHub HMAC-SHA256 signatures | No | `whsec_github_devflow_123` |

---

## 🔒 Security & RBAC Matrix

DevFlow enforces Role-Based Access Control both at the API middleware layer and within the React UI:

| Capability / Action | ADMIN | PROJECT_MANAGER | DEVELOPER | TESTER | VIEWER |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Workspace Settings & Billing** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Invite / Remove Team Members** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Create New Projects** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Manage & Complete Sprints** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Create Issues & Subtasks** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Update Issue Status & Workflows** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Post Comments & Attachments** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **View Boards, Issues & Metrics** | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 🧪 Testing

DevFlow includes automated TypeScript validation, unit tests, and end-to-end multi-tenant security test suites:

```bash
# Typecheck all monorepo packages
pnpm turbo typecheck

# Run full API & E2E security test suites
pnpm --filter @devflow/tests-e2e test
```

### Test Coverage Highlights:
- **Suite 01**: User Registration, Login, Profile & JWT verification.
- **Suite 02**: Security Policies, 2FA Authenticator & Session Management.
- **Suite 03**: Workspaces, Team Membership & RBAC Enforcement.
- **Suite 10**: Multi-Tenant Isolation & Insecure Direct Object Reference (IDOR) Protection.
- **Suite 11**: Payment Webhooks & Cryptographic Signature Validation.
- **Suite 12**: Production-Ready Secure Email OTP Login with Rate Limiting.

---

## 📦 Scripts

| Command | Action |
| :--- | :--- |
| `pnpm dev` | Starts both Next.js frontend and Express API concurrently with Turborepo |
| `pnpm build` | Compiles production bundles across all packages |
| `pnpm turbo typecheck` | Validates TypeScript types across the entire monorepo with zero emit |
| `pnpm --filter @devflow/database db:push` | Synchronizes Prisma schema with the PostgreSQL database |
| `pnpm --filter @devflow/database db:studio` | Launches Prisma Studio GUI for exploring database records |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
