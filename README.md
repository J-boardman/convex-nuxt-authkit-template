# Convex + Nuxt + WorkOS AuthKit Template

A full-stack template demonstrating authentication with [Convex](https://convex.dev), [Nuxt 4](https://nuxt.com), and [WorkOS AuthKit](https://workos.com/docs/user-management). Auth is handled server-side with encrypted session cookies, so sessions persist across page refreshes.

## Tech Stack

- **Nuxt 4** — SSR-enabled Vue framework
- **Convex** — Reactive backend (database, server functions)
- **WorkOS AuthKit** — Authentication (sign-in, sign-up, user management)
- **iron-webcrypto** — Encrypted session cookies

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A [Convex](https://dashboard.convex.dev) account
- A [WorkOS](https://dashboard.workos.com) account with AuthKit enabled

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd convex-nuxt-authkit
npm install
```

### 2. Set up Convex

```bash
npx convex dev
```

This will prompt you to create a new project (or link an existing one) and generate your `CONVEX_DEPLOYMENT` and `CONVEX_URL` values.

### 3. Set up WorkOS

1. Go to your [WorkOS Dashboard](https://dashboard.workos.com)
2. Navigate to **API Keys** and copy your **Client ID** and **API Key** (secret key starting with `sk_test_`)
3. Navigate to **Redirects** and add `http://localhost:3000/api/auth/callback`

### 4. Configure environment variables

Create a `.env.local` file in the project root:

```env
# Convex
CONVEX_DEPLOYMENT=<your-convex-deployment>
CONVEX_URL=<your-convex-url>

# WorkOS (server-side)
WORKOS_CLIENT_ID=client_...
WORKOS_API_KEY=sk_test_...
WORKOS_REDIRECT_URI=http://localhost:3000/api/auth/callback
WORKOS_COOKIE_PASSWORD=<random-string-at-least-32-characters>
```

Generate a cookie password with:

```bash
openssl rand -base64 32
```

### 5. Run the dev server

In one terminal, start the Convex dev server:

```bash
npx convex dev
```

In another terminal, start the Nuxt dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

### 1. Set environment variables

In your Vercel project settings, add these environment variables:

| Variable | Value |
|---|---|
| `CONVEX_URL` | Your Convex production deployment URL |
| `WORKOS_CLIENT_ID` | Your WorkOS client ID |
| `WORKOS_API_KEY` | Your WorkOS API key (secret) |
| `WORKOS_REDIRECT_URI` | `https://<your-domain>/api/auth/callback` |
| `WORKOS_COOKIE_PASSWORD` | Random 32+ character string |

### 2. Add the production redirect URI in WorkOS

In your [WorkOS Dashboard](https://dashboard.workos.com) under **Redirects**, add your production callback URL: `https://<your-domain>/api/auth/callback`

### 3. Deploy

```bash
npx convex deploy
vercel
```

## Project Structure

```
app/
  composables/
    useAuth.ts          # Auth composable (user state, sign-in/out)
    useConvexAuth.ts    # Convex auth state composable
  components/
    Authenticated.vue   # Renders children when authenticated
    Unauthenticated.vue # Renders children when not authenticated
    AuthLoading.vue     # Renders children while auth is loading
    TaskList.vue        # Example task list component
  pages/
    index.vue           # Home page
  plugins/
    workos-authkit.ts   # Auth plugin (provides state, initializes session)
server/
  api/auth/
    sign-in.get.ts      # Redirects to WorkOS login
    sign-up.get.ts      # Redirects to WorkOS signup
    callback.get.ts     # OAuth callback — exchanges code, sets session cookie
    sign-out.get.ts     # Clears session cookie
    session.get.ts      # Returns current session (auto-refreshes expired tokens)
  utils/
    auth.ts             # WorkOS client, cookie encrypt/decrypt, session management
convex/
  schema.ts             # Database schema
  tasks.ts              # Task queries and mutations (authenticated)
  auth.config.ts        # Convex auth provider config (WorkOS JWT verification)
```

## How Auth Works

1. User clicks **Sign In** — browser navigates to `/api/auth/sign-in`
2. Server redirects to WorkOS AuthKit hosted login page
3. After login, WorkOS redirects to `/api/auth/callback` with an authorization code
4. Server exchanges the code for access/refresh tokens and user info
5. Tokens are encrypted into an `httpOnly` session cookie using `iron-webcrypto`
6. User is redirected to `/` — the client plugin reads the session via `/api/auth/session`
7. The access token is passed to Convex for authenticated queries/mutations
8. On page refresh, the cookie persists and the session is restored automatically
9. Expired tokens are refreshed transparently when the session endpoint is called

## Usage in Components

```vue
<script setup lang="ts">
const { user, signIn, signOut } = useAuth();
</script>

<template>
  <AuthLoading>
    <p>Loading...</p>
  </AuthLoading>

  <Unauthenticated>
    <button @click="signIn()">Sign In</button>
  </Unauthenticated>

  <Authenticated>
    <p>Hello, {{ user?.email }}</p>
    <button @click="signOut()">Sign Out</button>
  </Authenticated>
</template>
```
