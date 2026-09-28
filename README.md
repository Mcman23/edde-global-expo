# EDDE Global Expo (`edde-global-expo`)

An interactive, premium international education tech experience built for **EDDE Global** exhibitions and fairs. Powered by Next.js 14 (App Router, TypeScript, Tailwind CSS), 3D/WebAR interactive globe, personalized education matching quiz, dynamic outcome recommendations, exclusive expo benefits, lead capture, WhatsApp instant redirection, and an administrative dashboard.

---

## 🚀 Experience Journey Flow

```text
[ Physical QR Code at Fair ]
            │
            ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ /expo?utm_source=exhibition&utm_medium=qr&utm_campaign=edde_global_expo   │
└──────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 1. Interactive 3D/WebAR Experience (Globe, Landmarks, Hotspots)          │
│    - Session initialized (Crypto UUID + SessionStorage)                 │
│    - Dynamic URL parameter preservation                                  │
└──────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 2. Smart Education Profile Quiz                                          │
│    - 5 targeted questions (Study level, field, destination, intake, budget)│
│    - Real-time progress bar and analytics tracking                      │
└──────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 3. Personalized Recommendation Result & Expo Benefit Offer               │
│    - Primary & alternative study destinations with tailored reasoning     │
│    - Exclusive benefit unlock card (e.g. Free University Shortlist)      │
└──────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 4. Lead Capture & Instant WhatsApp Redirection                           │
│    - Minimal friction form (Name, WhatsApp number, Email)               │
│    - Direct deep link to WhatsApp with pre-filled profile summary       │
└──────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 5. EDDE Global Admin Portal (/admin)                                     │
│    - Real-time lead tracking, status management, analytics, & export     │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Brand Identity Guidelines

- **Primary EDDE Purple**: `#53226C`
- **Vivid Purple**: `#6a0deb`
- **Accent Yellow**: `#ffde00`
- **Dark Neutral**: `#000000`
- **Light Neutral**: `#d9d9d9` / Soft Background `#faf7fb`
- **Typography**: Poppins (300 Light, 400 Regular, 700 Bold)
- **Style**: Premium, minimal, modern education-tech with thin-line icons (stroke 1.5–2px), generous whitespace, and large touch targets (min 48px height).

---

## 🛠️ Project Structure Tree

```text
edde-expo/
├── .env.example              # Environment variables template
├── .eslintrc.json            # ESLint Next.js configuration
├── .gitignore                # Git ignore rules
├── next.config.mjs           # Next.js configuration (strict mode, R3F transpile)
├── package.json              # Dependencies and scripts
├── postcss.config.mjs        # PostCSS configuration
├── README.md                 # Project documentation
├── tailwind.config.ts        # Extended Tailwind theme with EDDE brand tokens
├── tsconfig.json             # TypeScript strict configuration
├── docs/
│   └── DEPLOYMENT.md         # Comprehensive deployment and setup guide
├── supabase/
│   └── schema.sql            # Full database schema, RLS policies, seed data
└── src/
    ├── app/
    │   ├── globals.css       # Tailwind directives, CSS variables, utility classes
    │   ├── layout.tsx        # Root layout, Google Poppins font, viewport metadata
    │   └── page.tsx          # Server redirect component to /expo preserving query params
    ├── components/
    │   └── ui/
    │       ├── Button.tsx       # Framer Motion animated button with loading states
    │       ├── Disclaimer.tsx   # Legal guidance disclaimer component
    │       └── ProgressBar.tsx  # Branded progress indicator
    ├── lib/
    │   ├── analytics.ts      # Non-blocking fire-and-forget event tracking
    │   ├── session.ts        # Client session generator & manager with sessionStorage
    │   └── supabase.ts       # Supabase browser client helper (@supabase/ssr)
    └── types/
        └── index.ts          # Shared TypeScript interfaces & types
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env.local` for local development:

| Variable Name | Required | Description |
| :--- | :---: | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Supabase project URL (`https://xyz.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Supabase public anonymous API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | **Server-only** service key (Never commit or expose) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | **Yes** | E.164 formatted WhatsApp phone number (e.g. `447000000000`) |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Base domain URL of deployed app (e.g. `https://expo.eddeglobal.com`) |

---

## ⚡ Quickstart & Local Setup

1. **Clone and Install Dependencies**:
   ```bash
   cd edde-expo
   npm install
   ```

2. **Configure Environment Variables**:
   ```bash
   cp .env.example .env.local
   # Fill in your Supabase credentials and WhatsApp number in .env.local
   ```

3. **Database Setup**:
   - Log into your [Supabase Dashboard](https://app.supabase.com).
   - Go to **SQL Editor** -> **New Query**.
   - Copy the full contents of `supabase/schema.sql` and run it.

4. **Create Admin User**:
   - Go to Supabase **Authentication** -> **Users** -> **Add User**.
   - Copy the generated User UUID.
   - Run in SQL Editor:
     ```sql
     INSERT INTO admin_users (id, email, full_name)
     VALUES ('<USER-UUID>', 'admin@eddeglobal.com', 'EDDE Admin');
     ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) (redirects to `/expo`).

---

## 🚢 Deployment Overview

- **GitHub Repository**: Push code to GitHub repository.
- **Vercel**: Import repository, configure environment variables, and deploy.
- **QR Code**: Generate high-res QR code linking to:
  `https://your-app.vercel.app/expo?utm_source=exhibition&utm_medium=qr&utm_campaign=edde_global_expo`

For full step-by-step instructions, see [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md).
