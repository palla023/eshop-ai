# Next.js Auth Starter

Reusable Next.js starter with **Supabase Auth**, **role-based layouts**, and **placeholder pages** you can copy into any new project.

Built with Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Zustand, and Supabase.

## What you get

- Public routes: home, login, register
- Private routes: dashboard and role-based pages
- User vs admin menus
- Session checks in Next.js `proxy.ts` (JWT claims, not cookie-only `getSession()`)
- Client layout that loads the current profile and redirects if the session is invalid
- Login / register forms with Zod + React Hook Form
- Sign out that clears the Supabase session

## App structure

```text
src/
  app/
    (public)/          # /, /login, /register
    (private)/         # dashboard, products, orders, users, categories
  customLayout/        # public vs private shell, header, menus
  components/          # login/register forms + UI primitives
  config/              # Supabase browser + proxy clients
  services/users.ts    # signup, login, current user, sign out
  store/user-store.ts  # Zustand current-user store
  proxy.ts             # protect everything except public routes
```

After login:

- **user** → `/user/products`
- **admin** → `/admin/dashboard`

Promote a registered user to admin in Supabase (see SQL below). Registration always creates a `user` profile.

## Setup

1. Clone the repo and install dependencies:

```bash
git clone https://github.com/palla023/nextjs-auth-starter.git
cd nextjs-auth-starter
npm install
```

2. Create a [Supabase](https://supabase.com) project.

3. Copy env vars:

```bash
cp .env.example .env
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from **Project Settings → API**.

4. Run `supabase/schema.sql` in the Supabase SQL editor. That creates `user_profiles` with RLS.

5. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Make someone an admin

```sql
update public.user_profiles
set role = 'admin'
where email = 'you@example.com';
```

Then sign in with the **Admin** role selected on the login form.

## Reuse in another Next.js app

Copy these pieces first:

| Piece | Why |
| --- | --- |
| `src/config/` + `src/proxy.ts` | Auth cookies and route protection |
| `src/services/users.ts` | Register, login, current user |
| `src/store/user-store.ts` + `src/interfaces/` | Client user state |
| `src/customLayout/` | Header, menus, private shell |
| `src/components/login-form.tsx` + `register-form.tsx` | Auth UI |
| `src/app/(public)` + `src/app/(private)` | Route groups |

Then:

1. Add the same env vars
2. Run the SQL schema
3. Point `customLayout` public routes at your own public paths
4. Replace placeholder pages with your product screens

## Scripts

```bash
npm run dev    # development
npm run build  # production build
npm run start  # serve the production build
```

## License

MIT
