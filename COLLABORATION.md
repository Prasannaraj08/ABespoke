# 🤝 Team Collaboration Guide for ABespoke / Clara Platform
**Target Audience**: Developers and **Antigravity AI Agents** working across distributed setups.

---

## 🏛️ System Overview & Architecture

- **Live Production URL**: [https://abespokefashionspot.vercel.app](https://abespokefashionspot.vercel.app)
- **GitHub Repository**: [https://github.com/Prasannaraj08/ABespoke.git](https://github.com/Prasannaraj08/ABespoke.git)
- **Primary Branch**: `main` (auto-deploys to Vercel on push)
- **Backend**: Node.js + Express.js + TypeScript (`backend/`)
- **Database**: PostgreSQL (Neon Cloud) via Sequelize ORM with migrations (`backend/src/db/`)
- **Frontend**: React (Vite) + Tailwind CSS + Lucide Icons (`frontend/`)
- **Serverless API Wrapper**: `api/server.ts` + `vercel.json`

---

## 🔄 Daily Collaboration Workflow (For You & Antigravity)

When you or your teammate instruct Antigravity to work on a task, follow this routine:

### 1. Synchronize Before Coding
Always pull latest updates before making any code modifications:
```bash
git pull origin main
```

### 2. Feature Work & Quality Verification
After implementing changes:
```bash
# 1. Verify backend TypeScript compilation
cd backend && npx tsc --noEmit

# 2. Run automated security regression test suite
npx ts-node tests/security_regression.test.ts

# 3. Verify frontend build
cd ../frontend && npm run build
```

### 3. Commit & Push
Commit with concise, descriptive commit messages:
```bash
git add .
git commit -m "feat(module): description of changes"
git push origin main
```

---

## 🛡️ Security Guardrails (Do NOT Break)

When developing new features, ensure that the following core security principles are preserved:

1. **Financial Calculations (CWE-840)**:
   - NEVER accept `summary.total` or price amounts directly from the frontend request body.
   - Always recompute unit prices and subtotals authoritatively from the PostgreSQL database in `backend/src/controllers/orderController.ts`.

2. **Cloudinary Asset Deletion (CWE-639)**:
   - `DELETE /api/upload` is strictly restricted. Regular customers (`role === 'user'`) cannot delete media assets. Boutiques and designers can only delete assets that belong to their verified profiles/products.

3. **CORS Allowlist (CWE-346)**:
   - In `backend/src/app.ts`, only authorized domains (`abespokefashionspot.vercel.app`, `clarafashionspot.vercel.app`, and authorized preview links) are allowed. Never restore `callback(null, true)` wildcard fallbacks with `credentials: true`.

4. **Google Authentication (CWE-287)**:
   - Google Sign-In requires cryptographic signature verification via `google-auth-library`.
   - Google Sign-In is strictly disabled for Admin portals. Only authorized credentials (`tprraj2k8@gmail.com` and demo `abespokeadmin@example.com`) can access the Admin dashboard.

5. **Designer Auto-Approval Guard**:
   - Newly registered Fashion Designers start with `verified: false`.
   - Unverified designers cannot upload lookbook images or post collections until manually approved by the Administrator in the Admin Dashboard.

---

## 🔑 Environment Setup for New Team Members

When opening the project for the first time on another machine:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Prasannaraj08/ABespoke.git
   cd ABespoke
   ```
2. **Install dependencies**:
   ```bash
   npm install --prefix backend
   npm install --prefix frontend
   ```
3. **Environment Files**:
   - `.env` files are git-ignored for security.
   - Copy or obtain the shared `backend/.env` with `DATABASE_URL` (Neon PostgreSQL), `JWT_SECRET`, and `CLOUDINARY_*` keys from the repository owner.
4. **Run Local Servers**:
   - Backend: `npm run dev --prefix backend` (Runs on `http://localhost:5000`)
   - Frontend: `npm run dev --prefix frontend` (Runs on `http://localhost:5173`)
