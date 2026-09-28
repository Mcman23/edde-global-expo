# EDDE Global Expo - Deployment & Operations Guide

This document provides a complete, step-by-step production deployment guide for **EDDE Global Expo**.

---

## Step 1: Supabase Database Setup

1. **Create Supabase Project**:
   - Go to [https://database.new](https://database.new) and create a new project.
   - Choose a region close to your target event audience (e.g. Frankfurt, London, or Singapore).
   - Set a strong database password and copy your project URL and `anon` public key from **Settings -> API**.

2. **Execute Database Schema**:
   - Open **SQL Editor** in the Supabase Dashboard.
   - Click **New Query**.
   - Paste the contents of `supabase/schema.sql`.
   - Click **Run**.
   - Verify that all tables (`quiz_questions`, `quiz_options`, `quiz_sessions`, `quiz_answers`, `quiz_results`, `offers`, `campaigns`, `leads`, `analytics_events`, `admin_users`) were created successfully.

3. **Set Up Admin Account**:
   - Go to **Authentication -> Users -> Add User -> Create User**.
   - Enter an admin email and secure password (e.g., `admin@eddeglobal.com`).
   - Copy the generated `User UID` (a UUID string).
   - Return to **SQL Editor** and run:
     ```sql
     INSERT INTO admin_users (id, email, full_name)
     VALUES ('<YOUR-USER-UID>', 'admin@eddeglobal.com', 'EDDE Global Lead Manager');
     ```

---

## Step 2: Environment Configuration

Create a `.env.local` file for local testing and prepare environment variables for production on Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
NEXT_PUBLIC_WHATSAPP_NUMBER=447000000000
NEXT_PUBLIC_APP_URL=https://expo.eddeglobal.com
```

> ⚠️ **Security Warning**: `SUPABASE_SERVICE_ROLE_KEY` has full administrative access and bypasses RLS. Never prefix it with `NEXT_PUBLIC_` and never commit it to source control.

---

## Step 3: Source Control & GitHub Push

1. Initialize Git (if not already initialized):
   ```bash
   git init
   git add .
   git commit -m "feat: edde global expo initial commit"
   ```

2. Push to GitHub:
   ```bash
   git remote add origin git@github.com:your-organization/edde-global-expo.git
   git branch -M main
   git push -u origin main
   ```

---

## Step 4: Vercel Deployment

1. **Import Project into Vercel**:
   - Log into [Vercel](https://vercel.com).
   - Click **Add New -> Project**.
   - Select your `edde-global-expo` GitHub repository.

2. **Configure Project Settings**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (or `edde-expo` if nested)
   - **Build Command**: `next build`
   - **Output Directory**: `.next`

3. **Add Environment Variables**:
   Add all keys from Step 2 into Vercel Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_APP_URL`).

4. **Deploy**:
   - Click **Deploy**. Vercel will build and deploy the Next.js 14 application.

---

## Step 5: Custom Domain & QR Code Generation

### 1. Custom Domain Setup (Optional but Recommended)
In Vercel Project Settings -> **Domains**, add `expo.eddeglobal.com`. Configure CNAME / A records in your DNS provider.

### 2. QR Code URL Recommendation
For physical exhibition rollups, banners, badges, and brochures, generate QR codes pointing to the canonical entry URL with full UTM parameters:

```text
https://expo.eddeglobal.com/expo?utm_source=exhibition&utm_medium=qr&utm_campaign=edde_global_expo&utm_content=banner_stand
```

**Recommended QR Code Parameters**:
- **Format**: Vector SVG or high-resolution PNG (minimum 2000x2000px).
- **Color**: Dark EDDE Purple (`#53226C`) on solid white background.
- **Error Correction Level**: High (Level H - 30%) to allow logo embedding.
- **Center Logo**: EDDE Global icon/symbol centered.

---

## Step 6: Post-Deployment Verification Checklist

Perform these tests on physical devices prior to the exhibition event:

- [ ] **Mobile iOS Test (iPhone Safari)**:
  - Scan QR code using default Camera app.
  - Verify redirect to `/expo` with preserved query parameters.
  - Test 3D Globe loading & WebAR fallback button.
  - Complete 5 quiz questions.
  - Check recommendation result generation.
  - Fill lead capture form (Name, WhatsApp number).
  - Verify redirection to WhatsApp app with pre-filled text.
  - Confirm record created in Supabase `leads` and `analytics_events`.

- [ ] **Mobile Android Test (Chrome)**:
  - Scan QR code.
  - Verify WebAR model-viewer or 3D canvas rendering.
  - Complete quiz and verify responsive layout on various screen widths.

- [ ] **Desktop Test (Chrome / Safari / Firefox)**:
  - Access home route `/` -> verify automatic redirect to `/expo`.
  - Check responsive fallback layout and large touch button states.

- [ ] **Admin Portal Verification (`/admin`)**:
  - Log in with created admin user credentials.
  - Check real-time lead feed.
  - Verify lead status update functionality (`New` -> `Contacted` -> `Consultation`).
  - Test CSV export feature.

---

## Troubleshooting & Support

- **Database RLS Permission Errors**: Ensure policy `Anon insert leads` and `Anon insert analytics_events` are active in Supabase.
- **WhatsApp Link Not Opening**: Ensure `NEXT_PUBLIC_WHATSAPP_NUMBER` is purely digits in E.164 format without `+`, spaces, or dashes (e.g., `447000000000`).
